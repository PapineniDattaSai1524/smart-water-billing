package com.smartwater.billing.service;

import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.notification.NotificationResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Notification;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.NotificationMapper;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.NotificationRepository;
import com.smartwater.billing.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApartmentRepository apartmentRepository;
    @Mock private NotificationMapper notificationMapper;

    @InjectMocks
    private NotificationService notificationService;

    private User admin;
    private Apartment apartment;
    private Notification notification;
    private NotificationResponse notificationResponse;

    @BeforeEach
    void setUp() {
        admin = User.builder().id(100L).fullName("Admin User").build();
        apartment = Apartment.builder().id(1L).name("Palm Residency").admin(admin).build();
        notification = Notification.builder().id(9L).recipient(admin).type(NotificationType.USAGE_THRESHOLD_EXCEEDED)
                .title("High Water Usage Alert").message("Threshold exceeded").read(false).build();
        notificationResponse = NotificationResponse.builder().id(9L).type("USAGE_THRESHOLD_EXCEEDED")
                .title("High Water Usage Alert").message("Threshold exceeded").read(false).build();
    }

    // ---------- markAsRead ----------

    @Test
    void markAsRead_returnsTrue_whenNotificationBelongsToUser() {
        when(notificationRepository.markAsRead(9L, 100L)).thenReturn(1);

        boolean updated = notificationService.markAsRead(9L, 100L);

        assertThat(updated).isTrue();
        verify(notificationRepository).markAsRead(9L, 100L);
    }

    @Test
    void markAsRead_returnsFalse_whenNotificationDoesNotExistOrIsNotOwned() {
        when(notificationRepository.markAsRead(9L, 100L)).thenReturn(0);

        boolean updated = notificationService.markAsRead(9L, 100L);

        assertThat(updated).isFalse();
    }

    // ---------- search ----------

    @Test
    void search_returnsMappedPage_filteredByRequestingUser() {
        Pageable pageable = PageRequest.of(0, 20);
        LocalDateTime from = LocalDateTime.now().minusDays(7);
        LocalDateTime to = LocalDateTime.now();
        when(notificationRepository.search(100L, NotificationType.USAGE_THRESHOLD_EXCEEDED, false, from, to, pageable))
                .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationMapper.toResponse(notification)).thenReturn(notificationResponse);

        PageResponse<NotificationResponse> result = notificationService.search(
                100L, NotificationType.USAGE_THRESHOLD_EXCEEDED, false, from, to, pageable);

        assertThat(result.getContent()).containsExactly(notificationResponse);
        verify(notificationRepository).search(100L, NotificationType.USAGE_THRESHOLD_EXCEEDED, false, from, to, pageable);
    }

    @Test
    void search_allowsNullFilters_forAnUnfilteredSearch() {
        Pageable pageable = PageRequest.of(0, 20);
        when(notificationRepository.search(eq(100L), eq(null), eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationMapper.toResponse(notification)).thenReturn(notificationResponse);

        PageResponse<NotificationResponse> result = notificationService.search(100L, null, null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // ---------- searchByApartment ----------

    @Test
    void searchByApartment_returnsMappedPage_whenAdminOwnsApartment() {
        Pageable pageable = PageRequest.of(0, 20);
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));
        when(notificationRepository.searchByApartment(1L, null, null, null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationMapper.toResponse(notification)).thenReturn(notificationResponse);

        PageResponse<NotificationResponse> result = notificationService.searchByApartment(
                1L, 100L, null, null, null, null, pageable);

        assertThat(result.getContent()).containsExactly(notificationResponse);
    }

    @Test
    void searchByApartment_throwsUnauthorized_whenRequestingAdminDoesNotOwnApartment() {
        Pageable pageable = PageRequest.of(0, 20);
        User otherAdmin = User.builder().id(999L).fullName("Someone Else").build();
        when(apartmentRepository.findById(1L)).thenReturn(Optional.of(apartment));

        assertThatThrownBy(() -> notificationService.searchByApartment(1L, otherAdmin.getId(), null, null, null, null, pageable))
                .isInstanceOf(UnauthorizedActionException.class);
        verifyNoInteractions(notificationMapper);
        verify(notificationRepository, never()).searchByApartment(any(), any(), any(), any(), any(), any());
    }

    @Test
    void searchByApartment_throwsUnauthorized_whenApartmentHasNoAdminAssigned() {
        Pageable pageable = PageRequest.of(0, 20);
        Apartment unowned = Apartment.builder().id(2L).name("Unmanaged Towers").admin(null).build();
        when(apartmentRepository.findById(2L)).thenReturn(Optional.of(unowned));

        assertThatThrownBy(() -> notificationService.searchByApartment(2L, 100L, null, null, null, null, pageable))
                .isInstanceOf(UnauthorizedActionException.class);
    }

    @Test
    void searchByApartment_throwsResourceNotFound_whenApartmentDoesNotExist() {
        Pageable pageable = PageRequest.of(0, 20);
        when(apartmentRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.searchByApartment(404L, 100L, null, null, null, null, pageable))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
