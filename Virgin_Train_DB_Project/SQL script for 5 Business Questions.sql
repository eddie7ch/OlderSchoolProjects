USE Virgin_Train_DB;
GO

-- ============================================
-- Business Questions
-- ============================================

-- Q1: List all ticket costs from London Euston to Manchester Piccadilly
SELECT dep.StationName AS Departure, arr.StationName AS Arrival,
       tkt.TicketLevel,
       '£' + FORMAT(tkt.Cost, 'N2') AS CostGBP
FROM Tickets tkt
JOIN Services s ON tkt.ServiceID = s.ServiceID
JOIN Stations dep ON s.DepartureStationID = dep.StationID
JOIN Stations arr ON s.ArrivalStationID = arr.StationID
WHERE dep.StationName='London Euston' AND arr.StationName='Manchester Piccadilly';
GO

-- Q2: Find the cheapest ticket per London-origin route
SELECT arr.StationName AS Destination,
       '£' + FORMAT(MIN(tkt.Cost), 'N2') AS CheapestCost
FROM Tickets tkt
JOIN Services s ON tkt.ServiceID = s.ServiceID
JOIN Stations dep ON s.DepartureStationID = dep.StationID
JOIN Stations arr ON s.ArrivalStationID = arr.StationID
WHERE dep.StationName='London Euston'
GROUP BY arr.StationName;
GO

-- Q3: Calculate daily seat capacity per route
SELECT arr.StationName AS Destination,
       tr.TrainType, tr.Capacity, s.FrequencyPerDay,
       (tr.Capacity * s.FrequencyPerDay) AS DailySeatCapacity
FROM Services s
JOIN Trains tr ON s.TrainID = tr.TrainID
JOIN Stations arr ON s.ArrivalStationID = arr.StationID
JOIN Stations dep ON s.DepartureStationID = dep.StationID
WHERE dep.StationName='London Euston';
GO

-- Q4: Find the fastest journey time per route
SELECT arr.StationName AS Destination,
       MIN(DATEDIFF(MINUTE, s.DepartureTime, s.ArrivalTime)) AS FastestMinutes
FROM Services s
JOIN Stations dep ON s.DepartureStationID = dep.StationID
JOIN Stations arr ON s.ArrivalStationID = arr.StationID
WHERE dep.StationName='London Euston'
GROUP BY arr.StationName;
GO

-- Q5: Compare average cost by ticket level per route
SELECT arr.StationName AS Destination,
       tkt.TicketLevel,
       '£' + FORMAT(AVG(tkt.Cost), 'N2') AS AvgCost
FROM Tickets tkt
JOIN Services s ON tkt.ServiceID = s.ServiceID
JOIN Stations dep ON s.DepartureStationID = dep.StationID
JOIN Stations arr ON s.ArrivalStationID = arr.StationID
WHERE dep.StationName='London Euston'
GROUP BY arr.StationName, tkt.TicketLevel;
GO