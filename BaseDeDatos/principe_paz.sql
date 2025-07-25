-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-07-2025 a las 16:33:27
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `principe_paz`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `nombre_estudiante` varchar(100) NOT NULL,
  `documento_estudiante` varchar(20) NOT NULL,
  `curso` varchar(10) NOT NULL,
  `nombre_acudiente` varchar(100) NOT NULL,
  `documento_acudiente` varchar(20) NOT NULL,
  `valor_matricula` int(11) DEFAULT 0,
  `valor_pension` int(11) DEFAULT 0,
  `valor_carne` int(11) DEFAULT 0,
  `valor_agenda` int(11) DEFAULT 0,
  `valor_seguro` int(11) DEFAULT 0,
  `total_pagado` int(11) DEFAULT 0,
  `valor_esperado` int(11) DEFAULT 0,
  `deuda` int(11) DEFAULT 0,
  `meses_pagados` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `referencia_pago` varchar(50) DEFAULT NULL,
  `es_docente` tinyint(1) DEFAULT 0,
  `descuento_pension` float DEFAULT 0,
  `carnet` tinyint(1) DEFAULT 1,
  `agenda` tinyint(1) DEFAULT 1,
  `seguro` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `recibo_caja` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `nombre_estudiante`, `documento_estudiante`, `curso`, `nombre_acudiente`, `documento_acudiente`, `valor_matricula`, `valor_pension`, `valor_carne`, `valor_agenda`, `valor_seguro`, `total_pagado`, `valor_esperado`, `deuda`, `meses_pagados`, `observaciones`, `referencia_pago`, `es_docente`, `descuento_pension`, `carnet`, `agenda`, `seguro`, `fecha_creacion`, `recibo_caja`) VALUES
(1, 'Fidel', '1028662005', '1001', 'Catalina', '30657918', 341000, 301000, 21000, 42000, 0, 1909000, 3414000, 1505000, '[\"Febrero\",\"Marzo\",\"Abril\",\"Mayo\",\"Junio\"]', '', 'F.V', 0, 0, 1, 1, 0, '2025-07-25 14:28:00', 'R.C');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento_estudiante` (`documento_estudiante`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
