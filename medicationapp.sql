-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 17, 2025 at 03:40 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medicationapp`
--

-- --------------------------------------------------------

--
-- Table structure for table `diseasegroup`
--

CREATE TABLE `diseasegroup` (
  `GroupID` int(11) NOT NULL,
  `GroupName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `diseasegroup`
--

INSERT INTO `diseasegroup` (`GroupID`, `GroupName`) VALUES
(1, 'โรคเบาหวาน'),
(2, 'โรคความดัน');

-- --------------------------------------------------------

--
-- Table structure for table `dosageunit`
--

CREATE TABLE `dosageunit` (
  `UnitID` int(11) NOT NULL,
  `DosageType` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dosageunit`
--

INSERT INTO `dosageunit` (`UnitID`, `DosageType`) VALUES
(1, 'มิลลิกรัม'),
(2, 'มิลลิลิตร'),
(3, 'ซีซี'),
(4, 'ทา');

-- --------------------------------------------------------

--
-- Table structure for table `duration`
--

CREATE TABLE `duration` (
  `DurationID` int(11) NOT NULL,
  `StartTime` date DEFAULT NULL,
  `EndTime` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `duration`
--

INSERT INTO `duration` (`DurationID`, `StartTime`, `EndTime`) VALUES
(1, '2025-06-01', '2025-09-01');

-- --------------------------------------------------------

--
-- Table structure for table `mealschedule`
--

CREATE TABLE `mealschedule` (
  `MealID` int(11) NOT NULL,
  `MealName` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mealschedule`
--

INSERT INTO `mealschedule` (`MealID`, `MealName`) VALUES
(1, 'เช้า'),
(2, 'กลางวัน'),
(3, 'เย็น'),
(4, 'ก่อนนอน');

-- --------------------------------------------------------

--
-- Table structure for table `medication`
--

CREATE TABLE `medication` (
  `MedicationID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Note` text DEFAULT NULL,
  `GroupID` int(11) DEFAULT NULL,
  `TypeID` int(11) DEFAULT NULL,
  `Dosage` int(11) DEFAULT NULL,
  `UnitID` int(11) DEFAULT NULL,
  `UsageMealID` int(11) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `Priority` int(11) DEFAULT NULL,
  `TimeID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication`
--

INSERT INTO `medication` (`MedicationID`, `UserID`, `Name`, `Note`, `GroupID`, `TypeID`, `Dosage`, `UnitID`, `UsageMealID`, `StartDate`, `EndDate`, `Priority`, `TimeID`) VALUES
(1, 1, 'test', 'hello world', 1, 2, 50, 2, 2, NULL, NULL, 2, NULL),
(9, 1, 'testtttt', 'hello world', 2, 1, 100, 1, 3, '2025-07-01', '2025-08-22', 1, NULL),
(18, NULL, 'asdas', 'jhgjhg', 2, 1, 245, 2, 2, NULL, NULL, 2, NULL),
(19, 1, 'asdasd', '', 2, 1, 1232, 2, 2, NULL, NULL, 2, NULL),
(21, NULL, 'Hello', 'Sodoirow929rr8f', 1, 1, 555, 1, 2, NULL, NULL, 2, NULL),
(22, 4, 'สวัสดีวันจันทร์', 'กยยดยกงำงเ', 1, 1, 465, 3, 3, '2025-07-30', '2025-08-14', 1, 3),
(23, NULL, 'ไลบอยพยำย', 'บกบิบำงดวิ', 1, 2, 99, 1, 2, '2025-07-30', '2025-08-11', 1, 2),
(24, 2, 'ทดสอบ', 'บดบอบำบอยเยดยยิ', 1, 3, 1, 3, 2, '2025-07-30', '2025-08-06', 1, 3),
(25, NULL, 'ทดสอบอีกแล้ว', 'อบดจำยวเเยยเ', 1, 3, 1, 1, 1, '2025-07-30', '2025-07-30', 1, 1),
(26, 1, 'ทเสอบทดสอบทดสอบ', 'เบื่อออออ', 1, 1, 5, 3, 3, '2025-08-13', '2025-08-31', 1, 3),
(27, NULL, 'ไม่ไหวล้าาาาาา', 'ำวกวแววดววด', 1, 1, 50, 1, 3, '2025-07-30', '2025-07-30', 1, 2),
(28, 1, '111111', '', 2, 2, 50, 3, 3, '2025-07-31', '2025-07-31', 2, 3),
(29, 2, '2222222', 'โยีวววว', 2, 3, 222, 3, 3, '2025-07-31', '2025-07-31', 1, 3),
(30, 1, 'ยาท่อน', 'แมวท่อน', NULL, 2, NULL, NULL, 2, '2025-07-31', '2025-07-31', 2, 3),
(31, NULL, 'อ้อม', '', 1, 2, 1, NULL, 1, '2025-08-14', '2025-08-19', 2, NULL),
(32, NULL, 'อ้อม', '', 1, 1, 1, 1, 1, '2025-08-13', '2025-08-13', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medicationhistory`
--

CREATE TABLE `medicationhistory` (
  `HistoryID` int(11) NOT NULL,
  `MedicationID` int(11) DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `old_dosage` int(11) DEFAULT NULL,
  `new_dosage` int(11) DEFAULT NULL,
  `old_defaultMealTime` time DEFAULT NULL,
  `new_defaultMealTime` time DEFAULT NULL,
  `old_meal_time` time DEFAULT NULL,
  `new_meal_time` time DEFAULT NULL,
  `old_start_date` date DEFAULT NULL,
  `new_start_date` date DEFAULT NULL,
  `old_end_date` date DEFAULT NULL,
  `new_end_date` date DEFAULT NULL,
  `old_time_offset` time DEFAULT NULL,
  `new_time_offset` time DEFAULT NULL,
  `changed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medicationlog`
--

CREATE TABLE `medicationlog` (
  `LogID` int(11) NOT NULL,
  `MedicationID` int(11) DEFAULT NULL,
  `ScheduleID` int(11) DEFAULT NULL,
  `Count` int(11) DEFAULT NULL,
  `PerCount` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `SideEffects` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medicationschedule`
--

CREATE TABLE `medicationschedule` (
  `ScheduleID` int(11) NOT NULL,
  `MedicationID` int(11) DEFAULT NULL,
  `DefaultTime_ID` int(11) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Time` time DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `SideEffects` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicationschedule`
--

INSERT INTO `medicationschedule` (`ScheduleID`, `MedicationID`, `DefaultTime_ID`, `Date`, `Time`, `Status`, `SideEffects`) VALUES
(1, 1, 1, '2025-07-05', '17:55:57', NULL, NULL),
(2, 26, 2, '2025-08-14', '12:30:00', 'ยังไม่กิน', NULL),
(3, 26, 3, '2025-08-14', '18:00:00', 'ยังไม่กิน', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medicationtype`
--

CREATE TABLE `medicationtype` (
  `TypeID` int(11) NOT NULL,
  `TypeName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicationtype`
--

INSERT INTO `medicationtype` (`TypeID`, `TypeName`) VALUES
(1, 'เม็ด'),
(2, 'น้ำ'),
(3, 'ฉีด'),
(4, 'ทา');

-- --------------------------------------------------------

--
-- Table structure for table `medication_defaulttime`
--

CREATE TABLE `medication_defaulttime` (
  `id` int(11) NOT NULL,
  `medicationid` int(11) DEFAULT NULL,
  `defaulttime_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_defaulttime`
--

INSERT INTO `medication_defaulttime` (`id`, `medicationid`, `defaulttime_id`) VALUES
(2, 21, 1),
(3, 21, 3),
(4, 22, 1),
(5, 22, 2),
(6, 22, 4),
(7, 23, 1),
(8, 23, 4),
(9, 24, 1),
(10, 24, 3),
(11, 24, 4),
(12, 25, 1),
(13, 25, 3),
(14, 26, 2),
(15, 26, 3),
(16, 27, 1),
(17, 27, 2),
(18, 28, 1),
(19, 28, 4),
(20, 29, 3),
(21, 29, 2),
(22, 30, 1),
(23, 31, 1),
(24, 32, 1);

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `NotificationID` int(11) NOT NULL,
  `ScheduleID` int(11) DEFAULT NULL,
  `Time` time DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`NotificationID`, `ScheduleID`, `Time`, `Status`) VALUES
(1, 1, '17:50:52', 'taken');

-- --------------------------------------------------------

--
-- Table structure for table `priority`
--

CREATE TABLE `priority` (
  `PriorityID` int(11) NOT NULL,
  `PriorityName` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `priority`
--

INSERT INTO `priority` (`PriorityID`, `PriorityName`) VALUES
(1, 'ปกติ'),
(2, 'สำคัญ');

-- --------------------------------------------------------

--
-- Table structure for table `usagemeal`
--

CREATE TABLE `usagemeal` (
  `UsageMealID` int(11) NOT NULL,
  `MealName` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usagemeal`
--

INSERT INTO `usagemeal` (`UsageMealID`, `MealName`) VALUES
(1, 'พร้อมอาหาร'),
(2, 'ก่อนอาหาร'),
(3, 'หลังอาหาร');

-- --------------------------------------------------------

--
-- Table structure for table `usagemealtime`
--

CREATE TABLE `usagemealtime` (
  `TimeID` int(11) NOT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usagemealtime`
--

INSERT INTO `usagemealtime` (`TimeID`, `time`) VALUES
(1, '00:00:00'),
(2, '00:15:00'),
(3, '00:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `userdefaultmealtime`
--

CREATE TABLE `userdefaultmealtime` (
  `DefaultTime_ID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `MealID` int(11) DEFAULT NULL,
  `Time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userdefaultmealtime`
--

INSERT INTO `userdefaultmealtime` (`DefaultTime_ID`, `UserID`, `MealID`, `Time`) VALUES
(1, 1, 1, '09:00:00'),
(2, 1, 2, '12:30:00'),
(3, 1, 3, '18:00:00'),
(4, 1, 4, '21:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Name` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Gender` varchar(10) DEFAULT NULL,
  `BirthDate` date DEFAULT NULL,
  `BloodType` varchar(5) DEFAULT NULL,
  `DefaultTime_ID` int(11) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Name`, `Email`, `Phone`, `Gender`, `BirthDate`, `BloodType`, `DefaultTime_ID`, `Password`) VALUES
(1, 'Therapat Pinprom', 'Therapat@gmail.com', '0891234567', 'Male', '2002-05-10', 'O', 1, '$2b$10$lSjzPS74Pfh0RG7CBqZyuubHzaXcDfPBEghlAthfarsw5/eDS7G6a'),
(2, 'Aom', 'test@gmail.com', '0123456789', 'Female', '2017-07-01', 'A', 1, NULL),
(3, 'Soodididiei', 'test1245@gmail.com', '0123456789', 'Male', '2025-08-12', 'AB', NULL, '$2b$10$Td6rhhbrODvRPiEgoD8tFur/Oya5cvAijrFiqBDg11UNptFB0CszO'),
(4, 'Test Test', 'Testt@gmail.com', '0123456789', 'Male', '2023-08-29', 'A', NULL, '$2b$10$UUaHXmE8/G55B3yTiyLGU.0kTKxOKqORxcNcIg3T6KPiUSpzOWdt2'),
(5, 'สุชานันท์', 'suchanan.srithep@gmail.com', '0970464781', 'Female', '2003-09-18', 'A', NULL, '$2b$10$ykfcWDfnmaKNSIn4vB3HveBh7uIwV0WbMAyLSXBy/e40P5cBoy5ce');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `diseasegroup`
--
ALTER TABLE `diseasegroup`
  ADD PRIMARY KEY (`GroupID`);

--
-- Indexes for table `dosageunit`
--
ALTER TABLE `dosageunit`
  ADD PRIMARY KEY (`UnitID`);

--
-- Indexes for table `duration`
--
ALTER TABLE `duration`
  ADD PRIMARY KEY (`DurationID`);

--
-- Indexes for table `mealschedule`
--
ALTER TABLE `mealschedule`
  ADD PRIMARY KEY (`MealID`);

--
-- Indexes for table `medication`
--
ALTER TABLE `medication`
  ADD PRIMARY KEY (`MedicationID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `GroupID` (`GroupID`),
  ADD KEY `TypeID` (`TypeID`),
  ADD KEY `UnitID` (`UnitID`),
  ADD KEY `UsageMealID` (`UsageMealID`),
  ADD KEY `Priority` (`Priority`),
  ADD KEY `fk_medication_timeid` (`TimeID`);

--
-- Indexes for table `medicationhistory`
--
ALTER TABLE `medicationhistory`
  ADD PRIMARY KEY (`HistoryID`),
  ADD KEY `MedicationID` (`MedicationID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `medicationlog`
--
ALTER TABLE `medicationlog`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `MedicationID` (`MedicationID`),
  ADD KEY `ScheduleID` (`ScheduleID`);

--
-- Indexes for table `medicationschedule`
--
ALTER TABLE `medicationschedule`
  ADD PRIMARY KEY (`ScheduleID`),
  ADD KEY `MedicationID` (`MedicationID`),
  ADD KEY `DefaultTime_ID` (`DefaultTime_ID`);

--
-- Indexes for table `medicationtype`
--
ALTER TABLE `medicationtype`
  ADD PRIMARY KEY (`TypeID`);

--
-- Indexes for table `medication_defaulttime`
--
ALTER TABLE `medication_defaulttime`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medicationid` (`medicationid`),
  ADD KEY `defaulttime_id` (`defaulttime_id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`NotificationID`),
  ADD KEY `ScheduleID` (`ScheduleID`);

--
-- Indexes for table `priority`
--
ALTER TABLE `priority`
  ADD PRIMARY KEY (`PriorityID`);

--
-- Indexes for table `usagemeal`
--
ALTER TABLE `usagemeal`
  ADD PRIMARY KEY (`UsageMealID`);

--
-- Indexes for table `usagemealtime`
--
ALTER TABLE `usagemealtime`
  ADD PRIMARY KEY (`TimeID`);

--
-- Indexes for table `userdefaultmealtime`
--
ALTER TABLE `userdefaultmealtime`
  ADD PRIMARY KEY (`DefaultTime_ID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `MealID` (`MealID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD KEY `fk_users_defaulttime` (`DefaultTime_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `diseasegroup`
--
ALTER TABLE `diseasegroup`
  MODIFY `GroupID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dosageunit`
--
ALTER TABLE `dosageunit`
  MODIFY `UnitID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `duration`
--
ALTER TABLE `duration`
  MODIFY `DurationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `mealschedule`
--
ALTER TABLE `mealschedule`
  MODIFY `MealID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medication`
--
ALTER TABLE `medication`
  MODIFY `MedicationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `medicationhistory`
--
ALTER TABLE `medicationhistory`
  MODIFY `HistoryID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medicationlog`
--
ALTER TABLE `medicationlog`
  MODIFY `LogID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medicationschedule`
--
ALTER TABLE `medicationschedule`
  MODIFY `ScheduleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `medicationtype`
--
ALTER TABLE `medicationtype`
  MODIFY `TypeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `medication_defaulttime`
--
ALTER TABLE `medication_defaulttime`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `NotificationID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `priority`
--
ALTER TABLE `priority`
  MODIFY `PriorityID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usagemeal`
--
ALTER TABLE `usagemeal`
  MODIFY `UsageMealID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `usagemealtime`
--
ALTER TABLE `usagemealtime`
  MODIFY `TimeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `userdefaultmealtime`
--
ALTER TABLE `userdefaultmealtime`
  MODIFY `DefaultTime_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `medication`
--
ALTER TABLE `medication`
  ADD CONSTRAINT `fk_medication_timeid` FOREIGN KEY (`TimeID`) REFERENCES `usagemealtime` (`TimeID`),
  ADD CONSTRAINT `medication_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `medication_ibfk_2` FOREIGN KEY (`GroupID`) REFERENCES `diseasegroup` (`GroupID`),
  ADD CONSTRAINT `medication_ibfk_3` FOREIGN KEY (`TypeID`) REFERENCES `medicationtype` (`TypeID`),
  ADD CONSTRAINT `medication_ibfk_4` FOREIGN KEY (`UnitID`) REFERENCES `dosageunit` (`UnitID`),
  ADD CONSTRAINT `medication_ibfk_5` FOREIGN KEY (`UsageMealID`) REFERENCES `usagemeal` (`UsageMealID`),
  ADD CONSTRAINT `medication_ibfk_8` FOREIGN KEY (`Priority`) REFERENCES `priority` (`PriorityID`);

--
-- Constraints for table `medicationhistory`
--
ALTER TABLE `medicationhistory`
  ADD CONSTRAINT `medicationhistory_ibfk_1` FOREIGN KEY (`MedicationID`) REFERENCES `medication` (`MedicationID`),
  ADD CONSTRAINT `medicationhistory_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `medicationlog`
--
ALTER TABLE `medicationlog`
  ADD CONSTRAINT `medicationlog_ibfk_1` FOREIGN KEY (`MedicationID`) REFERENCES `medication` (`MedicationID`),
  ADD CONSTRAINT `medicationlog_ibfk_2` FOREIGN KEY (`ScheduleID`) REFERENCES `medicationschedule` (`ScheduleID`);

--
-- Constraints for table `medicationschedule`
--
ALTER TABLE `medicationschedule`
  ADD CONSTRAINT `medicationschedule_ibfk_1` FOREIGN KEY (`MedicationID`) REFERENCES `medication` (`MedicationID`),
  ADD CONSTRAINT `medicationschedule_ibfk_2` FOREIGN KEY (`DefaultTime_ID`) REFERENCES `userdefaultmealtime` (`DefaultTime_ID`);

--
-- Constraints for table `medication_defaulttime`
--
ALTER TABLE `medication_defaulttime`
  ADD CONSTRAINT `medication_defaulttime_ibfk_1` FOREIGN KEY (`medicationid`) REFERENCES `medication` (`MedicationID`),
  ADD CONSTRAINT `medication_defaulttime_ibfk_2` FOREIGN KEY (`defaulttime_id`) REFERENCES `userdefaultmealtime` (`DefaultTime_ID`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`ScheduleID`) REFERENCES `medicationschedule` (`ScheduleID`);

--
-- Constraints for table `userdefaultmealtime`
--
ALTER TABLE `userdefaultmealtime`
  ADD CONSTRAINT `userdefaultmealtime_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `userdefaultmealtime_ibfk_2` FOREIGN KEY (`MealID`) REFERENCES `mealschedule` (`MealID`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_defaulttime` FOREIGN KEY (`DefaultTime_ID`) REFERENCES `userdefaultmealtime` (`DefaultTime_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
