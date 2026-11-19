import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/\d/, 'Must contain a digit')
  .regex(/[@$!%*?&#^()_+=-]/, 'Must contain a special character');

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(120),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    username: z
      .string()
      .min(4, 'Username must be at least 4 characters')
      .max(60)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, digits, dot, underscore, and hyphen allowed'),
    password: passwordRule,
    phoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number').optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'RESIDENT']),
    householdId: z.string().trim().max(60, 'Household ID is too long').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'RESIDENT' && !data.householdId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Household ID is required',
        path: ['householdId'],
      });
    }
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registrationSubmitSchema = z
  .object({
    communityName: z.string().min(1, 'Community name is required').max(150),
    apartmentName: z.string().min(1, 'Apartment name is required').max(150),
    addressLine: z.string().min(1, 'Apartment address is required').max(255),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    pincode: z.string().regex(/^\d{4,10}$/, 'Enter a valid pincode'),
    adminFullName: z.string().min(1, 'Administrator name is required').max(120),
    adminEmail: z.string().min(1, 'Email is required').email('Enter a valid email'),
    adminPhoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegistrationSubmitFormValues = z.infer<typeof registrationSubmitSchema>;

export const residentCreateSchema = z.object({
  householdId: z.coerce.number({ invalid_type_error: 'Household is required' }).int().positive('Household is required'),
  fullName: z.string().min(1, 'Full name is required').max(120),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  password: passwordRule,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number').optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
  familyMembers: z.coerce.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});
export type ResidentCreateFormValues = z.infer<typeof residentCreateSchema>;

export const residentUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number').optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
  familyMembers: z.coerce.number().int().min(0).optional(),
});
export type ResidentUpdateFormValues = z.infer<typeof residentUpdateSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const forgotPasswordSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Enter your registered username or email'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number').optional().or(z.literal('')),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordRule,
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const apartmentSchema = z.object({
  name: z.string().min(1, 'Apartment name is required').max(150),
  addressLine: z.string().min(1, 'Address is required').max(255),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  totalUnits: z.coerce.number().int().min(1, 'Total units must be at least 1'),
});
export type ApartmentFormValues = z.infer<typeof apartmentSchema>;

export const householdSchema = z.object({
  apartmentId: z.coerce.number().int().min(1, 'Apartment is required'),
  unitNumber: z.string().min(1, 'Unit number is required').max(30),
  areaSqft: z.coerce.number().positive('Area must be a positive number'),
  occupancyCount: z.coerce.number().int().min(1, 'Occupancy must be at least 1'),
  hasMeter: z.boolean(),
});
export type HouseholdFormValues = z.infer<typeof householdSchema>;

export const residentAssignmentSchema = z
  .object({
    householdId: z.coerce.number().int().min(1, 'Household is required'),
    userId: z.coerce.number().int().min(1, 'User is required'),
    relationType: z.enum(['PRIMARY', 'MEMBER']),
    moveInDate: z.string().min(1, 'Move-in date is required'),
    moveOutDate: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => !data.moveOutDate || data.moveOutDate >= data.moveInDate,
    { message: 'Move-out date cannot be earlier than move-in date', path: ['moveOutDate'] },
  );
export type ResidentAssignmentFormValues = z.infer<typeof residentAssignmentSchema>;

export const approveResidentSchema = z.object({
  apartmentId: z.coerce.number().int().min(1, 'Apartment is required'),
  householdId: z.coerce.number().int().min(1, 'Household is required'),
  relationType: z.enum(['PRIMARY', 'MEMBER']),
});
export type ApproveResidentFormValues = z.infer<typeof approveResidentSchema>;

export const meterConfigSchema = z.object({
  householdId: z.coerce.number().int().min(1, 'Household is required'),
  meterNumber: z.string().min(1, 'Meter number is required'),
  meterType: z.enum(['ANALOG', 'DIGITAL', 'SMART_IOT']),
  installationDate: z.string().min(1, 'Installation date is required'),
  initialReading: z.coerce.number().min(0, 'Initial reading cannot be negative'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'FAULTY', 'REPLACED']),
});
export type MeterConfigFormValues = z.infer<typeof meterConfigSchema>;

export const usageLogSchema = z.object({
  householdId: z.coerce.number().int().min(1, 'Household is required'),
  readingDate: z.string().min(1, 'Reading date is required'),
  meterReadingKl: z.coerce.number().min(0, 'Meter reading cannot be negative'),
  remarks: z.string().max(255).optional().or(z.literal('')),
});
export type UsageLogFormValues = z.infer<typeof usageLogSchema>;
