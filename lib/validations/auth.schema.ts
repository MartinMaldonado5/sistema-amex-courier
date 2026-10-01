import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo o usuario es requerido.')
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(1, 'La contraseña es requerida.'),
});

export const UserUpdateSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').optional(),
  rol: z.string().trim().min(2, 'El rol no es válido.').optional(),
  activo: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
