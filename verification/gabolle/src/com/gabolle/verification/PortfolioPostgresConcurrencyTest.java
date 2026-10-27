package com.gabolle.verification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.gabolle.backend.itinerary.application.ItineraryEditService;
import com.gabolle.backend.itinerary.domain.ItineraryRepository;
import com.gabolle.backend.itinerary.domain.ItineraryVersion;
import com.gabolle.backend.itinerary.domain.StaleItineraryVersionException;
import com.gabolle.backend.itinerary.presentation.ItineraryExceptionHandler;
import com.gabolle.backend.recommendation.support.TestDatabase;
import com.gabolle.backend.trip.application.TripCreationService;
import com.gabolle.backend.trip.domain.TripRepository.IdempotencyKeyConflictException;
import com.gabolle.backend.trip.presentation.TripExceptionHandler;
import com.gabolle.testslice.ItinerarySliceApplication;

/**
 * Original service proxies and PostgreSQL repositories, unchanged.
 * The latch synchronizes eight application-service invocations, not HTTP socket traffic.
 * No @Transactional on tests: each worker must commit or roll back independently.
 */
@SpringBootTest(classes = ItinerarySliceApplication.class, properties = {
    "spring.profiles.active=db", "spring.jpa.hibernate.ddl-auto=none", "spring.flyway.enabled=true",
    "gabolle.recommendation.service-version=portfolio-verification",
    "gabolle.recommendation.deployment-environment=isolated-test"
})
class PortfolioPostgresConcurrencyTest {
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        TestDatabase.registerDatasource(registry);
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "12");
    }

    @Autowired TripCreationService creation;
    @Autowired ItineraryEditService edit;
    @Autowired ItineraryRepository itineraries;
    @Autowired JdbcTemplate sql;
    @Autowired PlatformTransactionManager transactions;

    UUID userId;

    @BeforeEach
    void seedOwner() {
        userId = UUID.randomUUID();
        var now = OffsetDateTime.now(ZoneOffset.UTC);
        sql.update("INSERT INTO app_user (user_id, display_name, language, personalization_mode, status, created_at, updated_at) "
            + "VALUES (?, 'portfolio verification', 'ko', 'EXPLICIT_ONLY', 'ACTIVE', ?, ?)", userId, now, now);
    }

    private TripCreationService.Command command(int budget) {
        return new TripCreationService.Command(userId.toString(), LocalDate.of(2026, 11, 1),
            LocalDate.of(2026, 11, 1), 35.1587, 129.1604, budget, 2,
            "09:00-18:00", "Asia/Seoul", List.of(), List.of());
    }

    record Outcome(Object value, Throwable error) {}

    private List<Outcome> simultaneously(List<Callable<?>> tasks) throws Exception {
        var workers = Executors.newFixedThreadPool(8);
        var ready = new CountDownLatch(8);
        var start = new CountDownLatch(1);
        try {
            var futures = new ArrayList<java.util.concurrent.Future<Outcome>>();
            for (Callable<?> task : tasks) {
                futures.add(workers.submit(() -> {
                    ready.countDown();
                    if (!start.await(20, TimeUnit.SECONDS)) throw new AssertionError("start latch timeout");
                    try { return new Outcome(task.call(), null); }
                    catch (Throwable error) { return new Outcome(null, error); }
                }));
            }
            assertThat(ready.await(20, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            var results = new ArrayList<Outcome>();
            for (var future : futures) results.add(future.get(60, TimeUnit.SECONDS));
            return results;
        } finally {
            start.countDown();
            workers.shutdownNow();
            assertThat(workers.awaitTermination(10, TimeUnit.SECONDS)).isTrue();
        }
    }

    @RepeatedTest(value = 3, name = "identical same-key create [{currentRepetition}/{totalRepetitions}]")
    void eightIdenticalCreatesCommitExactlyOneTripAndReplaySameResult() throws Exception {
        String key = "portfolio-identical-" + UUID.randomUUID();
        var tasks = new ArrayList<Callable<?>>();
        for (int i = 0; i < 8; i++) tasks.add(() -> creation.create(command(100000), key));
        var results = simultaneously(tasks);
        assertThat(results).allSatisfy(r -> assertThat(r.error()).isNull());
        var values = results.stream().map(r -> (TripCreationService.Result) r.value()).toList();
        assertThat(values.stream().filter(TripCreationService.Result::created).count()).isEqualTo(1);
        assertThat(values.stream().map(r -> r.trip().tripId()).distinct().count()).isEqualTo(1);
        assertThat(values.stream().map(r -> r.snapshot().snapshotId()).distinct().count()).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM trip WHERE owner_user_id = ?", userId)).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM trip_idempotency WHERE user_id = ?", userId)).isEqualTo(1);
        var replay = creation.create(command(100000), key);
        assertThat(replay.created()).isFalse();
        assertThat(replay.trip().tripId()).isEqualTo(values.get(0).trip().tripId());
        var conflict = assertThrows(IdempotencyKeyConflictException.class, () -> creation.create(command(200000), key));
        assertThat(new TripExceptionHandler().handleIdempotencyConflict(conflict).getStatusCode().value()).isEqualTo(409);
        assertThat(count("SELECT count(*) FROM trip WHERE owner_user_id = ?", userId)).isEqualTo(1);
    }

    @RepeatedTest(value = 3, name = "mixed-body same-key create [{currentRepetition}/{totalRepetitions}]")
    void differentBodiesRacingForSameKeyYieldOneCreatedThreeReplaysFourConflicts() throws Exception {
        String key = "portfolio-mixed-" + UUID.randomUUID();
        var tasks = new ArrayList<Callable<?>>();
        for (int i = 0; i < 8; i++) {
            int budget = i % 2 == 0 ? 100000 : 200000;
            tasks.add(() -> creation.create(command(budget), key));
        }
        var results = simultaneously(tasks);
        var success = results.stream().filter(r -> r.error() == null).map(r -> (TripCreationService.Result) r.value()).toList();
        var failure = results.stream().filter(r -> r.error() != null).toList();
        assertThat(success).hasSize(4);
        assertThat(success.stream().filter(TripCreationService.Result::created).count()).isEqualTo(1);
        assertThat(success.stream().map(r -> r.trip().tripId()).distinct().count()).isEqualTo(1);
        assertThat(failure).hasSize(4).allSatisfy(r -> assertThat(r.error()).isInstanceOf(IdempotencyKeyConflictException.class));
        assertThat(count("SELECT count(*) FROM trip WHERE owner_user_id = ?", userId)).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM trip_idempotency WHERE user_id = ?", userId)).isEqualTo(1);
    }

    record Seed(UUID itinerary, UUID version, UUID itemKey) {}

    private Seed seedItinerary() {
        var trip = creation.create(command(100000), "seed-" + UUID.randomUUID()).trip();
        var seed = new Seed(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        var now = OffsetDateTime.now(ZoneOffset.UTC);
        UUID placeId = UUID.randomUUID();
        sql.update("INSERT INTO place (place_id, name_ko, created_at) VALUES (?, 'test place', ?)", placeId, now);
        sql.update("INSERT INTO itineraries (itinerary_id, trip_id, latest_version, created_at) VALUES (?, ?, 1, ?)", seed.itinerary(), UUID.fromString(trip.tripId()), now);
        sql.update("INSERT INTO itinerary_versions (itinerary_version_id, itinerary_id, version, base_version, operation, created_by, request_id, created_at) "
            + "VALUES (?, ?, 1, NULL, 'CREATE', ?, ?, ?)", seed.version(), seed.itinerary(), userId, "seed-" + UUID.randomUUID(), now);
        sql.update("INSERT INTO itinerary_item (itinerary_item_id, itinerary_version_id, item_key, day_index, visit_date, sequence, place_id, locked, data_status, created_at) "
            + "VALUES (?, ?, ?, 0, '2026-11-01', 1, ?, FALSE, 'UNKNOWN', ?)", UUID.randomUUID(), seed.version(), seed.itemKey(), placeId, now);
        return seed;
    }

    @RepeatedTest(value = 3, name = "same-base itinerary edit [{currentRepetition}/{totalRepetitions}]")
    void eightEditsOfSameBaseVersionCommitOneAndRejectSevenWithoutOrphanCopies() throws Exception {
        var seed = seedItinerary();
        var tasks = new ArrayList<Callable<?>>();
        for (int i = 0; i < 8; i++) tasks.add(() -> edit.setItemLocked(seed.itinerary().toString(), seed.itemKey().toString(), true, 1, userId.toString()));
        var results = simultaneously(tasks);
        assertThat(results.stream().filter(r -> r.error() == null).count()).isEqualTo(1);
        var failed = results.stream().filter(r -> r.error() != null).toList();
        assertThat(failed).hasSize(7).allSatisfy(r -> {
            assertThat(r.error()).isInstanceOf(StaleItineraryVersionException.class);
            var stale = (StaleItineraryVersionException) r.error();
            assertThat(stale.latestVersion()).isEqualTo(2);
            assertThat(new ItineraryExceptionHandler().handleStaleVersion(stale).getStatusCode().value()).isEqualTo(409);
        });
        assertThat(count("SELECT latest_version FROM itineraries WHERE itinerary_id = ?", seed.itinerary())).isEqualTo(2);
        assertThat(count("SELECT count(*) FROM itinerary_versions WHERE itinerary_id = ?", seed.itinerary())).isEqualTo(2);
        assertThat(count("SELECT count(*) FROM itinerary_item i JOIN itinerary_versions v ON v.itinerary_version_id = i.itinerary_version_id WHERE v.itinerary_id = ?", seed.itinerary())).isEqualTo(2);
        assertThat(count("SELECT count(*) FROM itinerary_item i JOIN itinerary_versions v ON v.itinerary_version_id = i.itinerary_version_id WHERE v.itinerary_id = ? AND v.version = 2 AND i.locked = TRUE", seed.itinerary())).isEqualTo(1);
    }

    @Test
    void failedPointerCompareAndSwapRollsBackCandidateVersionAndCopiedItems() {
        var seed = seedItinerary();
        UUID candidateId = UUID.randomUUID();
        Instant now = Instant.now();
        // Repository-level injection: version 3 has no slot conflict, but base 2 mismatches actual latest 1.
        var draft = com.gabolle.backend.itinerary.domain.ItineraryRevision.copyOf(itineraries.findContent(seed.itinerary().toString(), 1).orElseThrow(), candidateId.toString(), now);
        var candidate = new ItineraryVersion(candidateId.toString(), seed.itinerary().toString(), 3, 2,
            ItineraryVersion.Operation.LOCK_ITEM, userId.toString(), "rollback-" + UUID.randomUUID(),
            new ItineraryVersion.Versions(null, null, null, null, null), now);
        assertThrows(StaleItineraryVersionException.class, () -> itineraries.appendVersion(candidate, draft.items(), draft.legs(), draft.exclusions()));
        assertThat(count("SELECT latest_version FROM itineraries WHERE itinerary_id = ?", seed.itinerary())).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM itinerary_versions WHERE itinerary_version_id = ?", candidateId)).isZero();
        assertThat(count("SELECT count(*) FROM itinerary_item WHERE itinerary_version_id = ?", candidateId)).isZero();
    }

    @Test
    void serviceCreationParticipatesInTransactionAndLeavesNoKeyOrTripAfterRollback() {
        String key = "portfolio-rollback-" + UUID.randomUUID();
        var transaction = new TransactionTemplate(transactions);
        assertThrows(DeliberateRollback.class, () -> transaction.execute(status -> {
            creation.create(command(100000), key);
            throw new DeliberateRollback();
        }));
        assertThat(count("SELECT count(*) FROM trip WHERE owner_user_id = ?", userId)).isZero();
        assertThat(count("SELECT count(*) FROM trip_idempotency WHERE user_id = ?", userId)).isZero();
        assertThat(creation.create(command(100000), key).created()).isTrue();
    }

    static class DeliberateRollback extends RuntimeException {}
    private int count(String query, Object id) { return sql.queryForObject(query, Integer.class, id); }
}
