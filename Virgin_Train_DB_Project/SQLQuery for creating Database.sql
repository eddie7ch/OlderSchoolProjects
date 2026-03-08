-- ============================================
-- Virgin_Train_DB
-- ============================================

-- Create database if not exists
IF DB_ID('Virgin_Train_DB') IS NULL
    CREATE DATABASE Virgin_Train_DB;
GO
USE Virgin_Train_DB;
GO

-- Drop tables if they exist (in dependency order)
IF OBJECT_ID('Tickets', 'U') IS NOT NULL DROP TABLE Tickets;
IF OBJECT_ID('Services', 'U') IS NOT NULL DROP TABLE Services;
IF OBJECT_ID('Customers', 'U') IS NOT NULL DROP TABLE Customers;
IF OBJECT_ID('Trains', 'U') IS NOT NULL DROP TABLE Trains;
IF OBJECT_ID('Stations', 'U') IS NOT NULL DROP TABLE Stations;
GO

-- =========================
-- Tables
-- =========================
CREATE TABLE Stations (
    StationID INT IDENTITY(1,1) PRIMARY KEY,
    StationName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(100) NOT NULL
);

CREATE TABLE Trains (
    TrainID INT IDENTITY(1,1) PRIMARY KEY,
    TrainName NVARCHAR(100) NOT NULL,
    TrainType NVARCHAR(50) NOT NULL,
    Capacity INT NOT NULL
);

CREATE TABLE Services (
    ServiceID INT IDENTITY(1,1) PRIMARY KEY,
    TrainID INT NOT NULL,
    DepartureStationID INT NOT NULL,
    ArrivalStationID INT NOT NULL,
    DepartureTime DATETIME NOT NULL,
    ArrivalTime DATETIME NOT NULL,
    FrequencyPerDay INT NULL,
    CONSTRAINT FK_Services_Train FOREIGN KEY (TrainID) REFERENCES Trains(TrainID),
    CONSTRAINT FK_Services_Departure FOREIGN KEY (DepartureStationID) REFERENCES Stations(StationID),
    CONSTRAINT FK_Services_Arrival FOREIGN KEY (ArrivalStationID) REFERENCES Stations(StationID)
);

CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PaymentType NVARCHAR(50) NOT NULL
);

CREATE TABLE Tickets (
    TicketID INT IDENTITY(1,1) PRIMARY KEY,
    ServiceID INT NOT NULL,
    CustomerID INT NOT NULL,
    TicketLevel NVARCHAR(50) NOT NULL CHECK (TicketLevel IN ('Standard','First Class')),
    Cost DECIMAL(10,2) NOT NULL,   -- precise, two decimals
    CurrencyCode CHAR(3) NOT NULL DEFAULT 'GBP', -- ISO 4217 currency code
    CONSTRAINT FK_Tickets_Service FOREIGN KEY (ServiceID) REFERENCES Services(ServiceID),
    CONSTRAINT FK_Tickets_Customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
GO

-- =========================
-- Seed Data
-- =========================
INSERT INTO Stations (StationName, Location) VALUES
('London Euston', 'London'),
('Manchester Piccadilly', 'Manchester'),
('Birmingham New Street', 'Birmingham'),
('Glasgow Central', 'Glasgow'),
('Liverpool Lime Street', 'Liverpool');

INSERT INTO Trains (TrainName, TrainType, Capacity) VALUES
('Pendolino', 'Pendolino', 500),
('Voyager', 'Voyager', 250);

INSERT INTO Services (TrainID, DepartureStationID, ArrivalStationID, DepartureTime, ArrivalTime, FrequencyPerDay) VALUES
(1, 1, 2, '2025-10-29 08:00', '2025-10-29 10:07', 46), -- London → Manchester
(1, 1, 4, '2025-10-29 09:00', '2025-10-29 13:09', 13), -- London → Glasgow
(1, 1, 5, '2025-10-29 07:30', '2025-10-29 09:38', 16), -- London → Liverpool
(1, 1, 3, '2025-10-29 06:30', '2025-10-29 07:52', 49); -- London → Birmingham

INSERT INTO Customers (FirstName, LastName, Email, PaymentType) VALUES
('Test','CustomerA','custA@test.com','N/A'),
('Test','CustomerB','custB@test.com','N/A');

INSERT INTO Tickets (ServiceID, CustomerID, TicketLevel, Cost, CurrencyCode) VALUES
(1, 1, 'Standard', 45.00, 'GBP'),
(1, 2, 'First Class', 120.00, 'GBP'),
(2, 1, 'Standard', 80.00, 'GBP'),
(3, 2, 'Standard', 50.00, 'GBP'),
(4, 1, 'First Class', 150.00, 'GBP');
GO