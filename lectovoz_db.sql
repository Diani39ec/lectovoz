-- =====================================================
-- LectoVoz · Base de datos MySQL 8+
-- Base: lectovoz_db (utf8mb4)
-- Tablas: usuarios, preferencias_accesibilidad,
--         textos, lecturas, voces_favoritas
-- =====================================================
CREATE DATABASE IF NOT EXISTS lectovoz_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lectovoz_db;

-- ---------- 1. Usuarios ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  tipo_discapacidad ENUM('ceguera_total','baja_vision','otra','ninguna') DEFAULT 'baja_vision',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- 2. Preferencias de accesibilidad (1 por usuario) ----------
CREATE TABLE IF NOT EXISTS preferencias_accesibilidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  tamano_fuente DECIMAL(3,2) NOT NULL DEFAULT 1.25,
  alto_contraste TINYINT(1) NOT NULL DEFAULT 0,
  invertir_colores TINYINT(1) NOT NULL DEFAULT 0,
  resaltar_enlaces TINYINT(1) NOT NULL DEFAULT 0,
  velocidad_voz DECIMAL(2,1) NOT NULL DEFAULT 1.0,
  volumen DECIMAL(2,1) NOT NULL DEFAULT 1.0,
  voz_preferida VARCHAR(150) DEFAULT 'es-ES',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pref_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 3. Textos para leer ----------
CREATE TABLE IF NOT EXISTS textos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  titulo VARCHAR(200) NOT NULL,
  contenido MEDIUMTEXT NOT NULL,
  categoria ENUM('noticia','cuento','instruccion','documento','otro') DEFAULT 'otro',
  idioma VARCHAR(10) NOT NULL DEFAULT 'es-ES',
  num_palabras INT GENERATED ALWAYS AS (LENGTH(contenido) - LENGTH(REPLACE(contenido,' ','')) + 1) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_contenido (titulo, contenido),
  INDEX idx_categoria (categoria),
  CONSTRAINT fk_texto_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- 4. Historial de lecturas ----------
CREATE TABLE IF NOT EXISTS lecturas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  texto_id INT NOT NULL,
  duracion_seg INT NULL,
  velocidad_usada DECIMAL(2,1) DEFAULT 1.0,
  completada TINYINT(1) NOT NULL DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario_fecha (usuario_id, fecha),
  CONSTRAINT fk_lec_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_lec_texto FOREIGN KEY (texto_id)
    REFERENCES textos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- 5. Voces favoritas ----------
CREATE TABLE IF NOT EXISTS voces_favoritas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre_voz VARCHAR(150) NOT NULL,
  idioma VARCHAR(10) DEFAULT 'es-ES',
  UNIQUE KEY uq_usuario_voz (usuario_id, nombre_voz),
  CONSTRAINT fk_voz_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Vista: historial legible ----------
CREATE OR REPLACE VIEW vista_historial AS
SELECT l.id, u.nombre AS usuario, t.titulo AS texto,
       l.duracion_seg, l.velocidad_usada, l.completada, l.fecha
FROM lecturas l
JOIN usuarios u ON u.id = l.usuario_id
JOIN textos t ON t.id = l.texto_id;

-- =====================================================
-- Datos de ejemplo
-- =====================================================
INSERT INTO usuarios (nombre, email, tipo_discapacidad) VALUES
('Invitado Demo', 'invitado@lectovoz.app', 'baja_vision'),
('Maria Lopez', 'maria@lectovoz.app', 'ceguera_total')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO preferencias_accesibilidad (usuario_id, tamano_fuente, alto_contraste, velocidad_voz, voz_preferida)
SELECT id, 1.40, 1, 1.0, 'es-ES' FROM usuarios WHERE email='invitado@lectovoz.app'
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

INSERT INTO textos (usuario_id, titulo, contenido, categoria) VALUES
((SELECT id FROM usuarios WHERE email='invitado@lectovoz.app'),
 'Bienvenida a LectoVoz',
 'Bienvenido a LectoVoz. Esta aplicacion lee en voz alta cualquier texto para personas con discapacidad visual.',
 'instruccion'),
((SELECT id FROM usuarios WHERE email='invitado@lectovoz.app'),
 'Noticia de ejemplo',
 'La tecnologia de lectura en voz alta permite a millones de personas con discapacidad visual acceder a libros y noticias de forma autonoma.',
 'noticia'),
((SELECT id FROM usuarios WHERE email='invitado@lectovoz.app'),
 'Cuento corto',
 'Habia una vez una voz que vivia en una cajita. Cuando alguien escribia palabras, la voz despertaba y las cantaba.',
 'cuento');

INSERT INTO voces_favoritas (usuario_id, nombre_voz, idioma)
SELECT id, 'Microsoft Sabina - Spanish (Mexico)', 'es-MX'
FROM usuarios WHERE email='invitado@lectovoz.app'
ON DUPLICATE KEY UPDATE idioma = VALUES(idioma);
