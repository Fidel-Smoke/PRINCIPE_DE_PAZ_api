
-- Script convertido de MySQL/MariaDB a PostgreSQL

CREATE TABLE estudiantes (
  id SERIAL PRIMARY KEY,
  nombre_estudiante VARCHAR(100) NOT NULL,
  documento_estudiante VARCHAR(20) NOT NULL UNIQUE,
  curso VARCHAR(10) NOT NULL,
  nombre_acudiente VARCHAR(100) NOT NULL,
  documento_acudiente VARCHAR(20) NOT NULL,
  valor_matricula INTEGER DEFAULT 0,
  valor_pension INTEGER DEFAULT 0,
  valor_carne INTEGER DEFAULT 0,
  valor_agenda INTEGER DEFAULT 0,
  valor_seguro INTEGER DEFAULT 0,
  total_pagado INTEGER DEFAULT 0,
  valor_esperado INTEGER DEFAULT 0,
  deuda INTEGER DEFAULT 0,
  meses_pagados TEXT DEFAULT NULL,
  observaciones TEXT DEFAULT NULL,
  referencia_pago VARCHAR(50) DEFAULT NULL,
  es_docente BOOLEAN DEFAULT FALSE,
  descuento_pension REAL DEFAULT 0,
  carnet BOOLEAN DEFAULT TRUE,
  agenda BOOLEAN DEFAULT TRUE,
  seguro BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recibo_caja VARCHAR(50) DEFAULT NULL
);

-- Insertar datos en la tabla estudiantes
INSERT INTO estudiantes (
  id, nombre_estudiante, documento_estudiante, curso, nombre_acudiente, documento_acudiente,
  valor_matricula, valor_pension, valor_carne, valor_agenda, valor_seguro,
  total_pagado, valor_esperado, deuda, meses_pagados, observaciones, referencia_pago,
  es_docente, descuento_pension, carnet, agenda, seguro, fecha_creacion, recibo_caja
) VALUES (
  1, 'Fidel', '1028662005', '1001', 'Catalina', '30657918',
  341000, 301000, 21000, 42000, 0,
  1909000, 3414000, 1505000, '["Febrero","Marzo","Abril","Mayo","Junio"]', '', 'F.V',
  FALSE, 0, FALSE, TRUE, TRUE, '2025-07-25 14:28:00', 'R.C'
);

-- Reiniciar secuencia del ID si es necesario
SELECT setval(pg_get_serial_sequence('estudiantes', 'id'), COALESCE(MAX(id), 1), true) FROM estudiantes;
