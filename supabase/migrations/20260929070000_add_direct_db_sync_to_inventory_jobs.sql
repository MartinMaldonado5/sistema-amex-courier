-- Migración: Añadir campos de sincronización directa a la base de datos en inventario_jobs
ALTER TABLE public.inventario_jobs
  ADD COLUMN IF NOT EXISTS sincronizar_db BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS db_sincronizado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS db_actualizados INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS db_sincronizado_en TIMESTAMP WITH TIME ZONE;
