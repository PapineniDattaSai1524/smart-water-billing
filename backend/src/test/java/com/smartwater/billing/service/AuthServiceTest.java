package com.smartwater.billing.service;

import com.smartwater.billing.dto.auth.*;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.DuplicateResourceException;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.UserMapper;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.security.CustomUserDetails;
import com.smartwater.billing.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private UserMapper userMapper;
    @Mock private TenantAccessService tenantAccessService;
    @Mock private HouseholdRepository householdRepository;
    @Mock private ResidentAssignmentRepository residentAssignmentRepository;
    @Mock private ResidentAssignmentService residentAssignmentService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private Household household;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Ravi Kumar");
        registerRequest.setEmail("ravi.kumar@example.com");
        registerRequest.setUsername("ravikumar");
        registerRequest.setPassword("Password@123");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setRole(Role.RESIDENT);
        registerRequest.setHouseholdId("HH-1-A101");

        Apartment apartment = Apartment.builder().id(1L).name("Green Valley Residency").build();
        household = Household.builder().id(10L).apartment(apartment).unitNumber("A-101")
                .householdCode("HH-1-A101").build();
    }

    @Test
    void register_savesNewUserAndLinksHousehold_whenHouseholdIdIsValidAndUnclaimed() {
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed-password");
        when(householdRepository.findByHouseholdCodeIgnoreCase("HH-1-A101")).thenReturn(Optional.of(household));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L)).thenReturn(Collections.emptyList());
        User savedUser = User.builder().id(1L).username("ravikumar").email("ravi.kumar@example.com")
                .fullName("Ravi Kumar").role(Role.RESIDENT).password("hashed-password").enabled(true).build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(userMapper.toProfileResponse(savedUser)).thenReturn(
                UserProfileResponse.builder().id(1L).username("ravikumar").build());

        UserProfileResponse response = authService.register(registerRequest);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("ravikumar");
        verify(userRepository, times(2)).save(any(User.class));
        verify(residentAssignmentService).assign(any());
    }

    @Test
    void register_throwsDuplicateResourceException_whenUsernameAlreadyExists() {
        when(userRepository.existsByUsername("ravikumar")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsDuplicateResourceException_whenEmailAlreadyExists() {
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void register_throwsInvalidRequestException_whenResidentOmitsHouseholdId() {
        registerRequest.setHouseholdId(null);
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Household ID is required");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsResourceNotFoundException_whenHouseholdIdDoesNotExist() {
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(false);
        when(householdRepository.findByHouseholdCodeIgnoreCase("HH-1-A101")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("couldn't find a household");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsDuplicateResourceException_whenHouseholdIdAlreadyClaimed() {
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(false);
        when(householdRepository.findByHouseholdCodeIgnoreCase("HH-1-A101")).thenReturn(Optional.of(household));
        when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(10L))
                .thenReturn(List.of(mock(ResidentAssignment.class)));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_doesNotRequireHouseholdId_whenRoleIsAdmin() {
        registerRequest.setRole(Role.ADMIN);
        registerRequest.setHouseholdId(null);
        when(userRepository.existsByUsername("ravikumar")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("ravi.kumar@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashed-password");
        User savedUser = User.builder().id(2L).username("ravikumar").email("ravi.kumar@example.com")
                .fullName("Ravi Kumar").role(Role.ADMIN).password("hashed-password").enabled(true).build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(userMapper.toProfileResponse(savedUser)).thenReturn(
                UserProfileResponse.builder().id(2L).username("ravikumar").build());

        UserProfileResponse response = authService.register(registerRequest);

        assertThat(response.getId()).isEqualTo(2L);
        verify(userRepository, times(1)).save(any(User.class));
        verify(residentAssignmentService, never()).assign(any());
    }

    @Test
    void login_returnsJwtResponse_onSuccessfulAuthentication() {
        LoginRequest loginRequest = new LoginRequest("ravikumar", "Password@123");
        User user = User.builder().id(1L).username("ravikumar").email("ravi.kumar@example.com")
                .fullName("Ravi Kumar").role(Role.RESIDENT).password("hashed").enabled(true).build();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(tenantAccessService.isCommunitySuspended(eq(1L), eq(Role.RESIDENT))).thenReturn(false);
        when(jwtService.generateAccessToken(userDetails)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(userDetails)).thenReturn("refresh-token");
        when(jwtService.getAccessExpirationMs()).thenReturn(86400000L);

        JwtResponse response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getUsername()).isEqualTo("ravikumar");
        assertThat(response.getRole()).isEqualTo("RESIDENT");
    }
}
