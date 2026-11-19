package com.smartwater.billing.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordResponse {

    private String message;

    /**
     * Local-dev convenience only: the raw reset link, returned ONLY when
     * running outside the 'prod' profile AND email is not configured, so the
     * flow can be exercised end-to-end without standing up real SMTP. Never
     * populated in production -- see AuthService.forgotPassword.
     */
    private String devResetLink;
}
