package com.smartwater.billing.repository;

import com.smartwater.billing.entity.PasswordResetToken;
import com.smartwater.billing.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Any still-outstanding (unused) tokens for a user -- invalidated whenever a new one is issued or consumed. */
    List<PasswordResetToken> findByUserAndUsedAtIsNull(User user);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user AND t.usedAt IS NULL")
    void deleteUnusedTokensForUser(@Param("user") User user);
}
