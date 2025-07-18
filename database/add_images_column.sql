-- Migration pour ajouter la colonne images à la table voyages
-- Cette colonne stockera un tableau JSON des URLs d'images

-- Ajouter la colonne images à la table voyages
ALTER TABLE voyages 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN voyages.images IS 'Tableau JSON contenant les URLs de toutes les images du voyage';

-- Index pour optimiser les requêtes sur les images
CREATE INDEX IF NOT EXISTS idx_voyages_images ON voyages USING GIN (images);

-- Migrer les données existantes : copier image_url vers images[0] si images est vide
UPDATE voyages 
SET images = CASE 
  WHEN (images IS NULL OR jsonb_array_length(images) = 0) AND image_url IS NOT NULL 
  THEN jsonb_build_array(image_url)
  ELSE images
END
WHERE image_url IS NOT NULL 
  AND (images IS NULL OR jsonb_array_length(images) = 0); 