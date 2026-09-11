-- =====================================================================
-- HỌ VÀ TÊN: PHẠM VĂN TUYÊN
-- BÀI TẬP LỚN: BÀI 1. QUẢN LÝ NHÂN SỰ VÀ DỰ ÁN
-- HỆ QUẢN TRỊ CSDL: MICROSOFT SQL SERVER
-- =====================================================================

-- 1. TẠO CSDL
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QL_NhanSu_DuAn')
BEGIN
    ALTER DATABASE QL_NhanSu_DuAn SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QL_NhanSu_DuAn;
END
GO

CREATE DATABASE QL_NhanSu_DuAn;
GO

USE QL_NhanSu_DuAn;
GO

-- =====================================================================
-- 2. TẠO CÁC BẢNG VÀ RÀNG BUỘC TOÀN VẸN CƠ BẢN
-- =====================================================================

-- 2.1. BẢNG PHÒNG BAN (DEPARTMENT)
CREATE TABLE DEPARTMENT (
    DepartmentID   VARCHAR(10)   NOT NULL,
    DepartmentName NVARCHAR(100) NOT NULL,
    ManagerID      VARCHAR(10)   NULL,     -- Khóa ngoại tham chiếu EMPLOYEE(EmployeeID)
    ManagerStartDate DATE        NULL,
    Location       NVARCHAR(100) NULL,
    CONSTRAINT PK_Department PRIMARY KEY (DepartmentID),
    CONSTRAINT UQ_Department_Name UNIQUE (DepartmentName)
);
GO

-- 2.2. BẢNG NHÂN VIÊN (EMPLOYEE)
CREATE TABLE EMPLOYEE (
    EmployeeID     VARCHAR(10)    NOT NULL,
    FirstName      NVARCHAR(30)   NOT NULL,
    LastName       NVARCHAR(50)   NOT NULL,
    FullName       AS (LastName + N' ' + FirstName) PERSISTED,
    Gender         NVARCHAR(10)   NOT NULL,
    BirthDate      DATE           NOT NULL,
    HireDate       DATE           NOT NULL,
    Salary         DECIMAL(18,2)  NOT NULL,
    Email          VARCHAR(100)   NOT NULL,
    Phone          VARCHAR(20)    NULL,
    DepartmentID   VARCHAR(10)    NOT NULL, -- Khóa ngoại tham chiếu DEPARTMENT(DepartmentID)
    SupervisorID   VARCHAR(10)    NULL,     -- Khóa ngoại đệ quy tham chiếu EMPLOYEE(EmployeeID)
    CONSTRAINT PK_Employee PRIMARY KEY (EmployeeID),
    CONSTRAINT UQ_Employee_Email UNIQUE (Email),
    CONSTRAINT CK_Employee_Gender CHECK (Gender IN (N'Nam', N'Nữ')),
    CONSTRAINT CK_Employee_Salary CHECK (Salary > 0),
    CONSTRAINT CK_Employee_Dates CHECK (BirthDate < HireDate),
    CONSTRAINT CK_Employee_Supervisor CHECK (SupervisorID <> EmployeeID)
);
GO

-- 2.3. BẢNG DỰ ÁN (PROJECT)
CREATE TABLE PROJECT (
    ProjectID      VARCHAR(10)    NOT NULL,
    ProjectName    NVARCHAR(150)  NOT NULL,
    DepartmentID   VARCHAR(10)    NOT NULL, -- Phòng ban phụ trách chính
    StartDate      DATE           NOT NULL,
    EndDate        DATE           NOT NULL,
    Budget         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    Status         NVARCHAR(30)   NOT NULL,
    CONSTRAINT PK_Project PRIMARY KEY (ProjectID),
    CONSTRAINT UQ_Project_Name UNIQUE (ProjectName),
    CONSTRAINT CK_Project_Dates CHECK (StartDate < EndDate),
    CONSTRAINT CK_Project_Budget CHECK (Budget >= 0),
    CONSTRAINT CK_Project_Status CHECK (Status IN (N'Đang thực hiện', N'Hoàn thành', N'Tạm dừng', N'Đã hủy'))
);
GO

-- 2.4. BẢNG PHÂN CÔNG DỰ ÁN (WORKS_ON)
CREATE TABLE WORKS_ON (
    EmployeeID     VARCHAR(10)    NOT NULL,
    ProjectID      VARCHAR(10)    NOT NULL,
    AssignedDate   DATE           NOT NULL,
    Role           NVARCHAR(50)   NOT NULL,
    Hours          DECIMAL(6,2)   NOT NULL DEFAULT 0,
    Allowance      DECIMAL(18,2)  NOT NULL DEFAULT 0,
    CONSTRAINT PK_WorksOn PRIMARY KEY (EmployeeID, ProjectID),
    CONSTRAINT CK_WorksOn_Hours CHECK (Hours >= 0 AND Hours <= 1000),
    CONSTRAINT CK_WorksOn_Allowance CHECK (Allowance >= 0)
);
GO

-- 2.5. BẢNG NGƯỜI PHỤ THUỘC / CON (DEPENDENT)
CREATE TABLE DEPENDENT (
    DependentID    INT IDENTITY(1,1) NOT NULL,
    EmployeeID     VARCHAR(10)       NOT NULL,
    FullName       NVARCHAR(100)     NOT NULL,
    Gender         NVARCHAR(10)      NOT NULL,
    BirthDate      DATE              NOT NULL,
    Relationship   NVARCHAR(30)      NOT NULL DEFAULT N'Con',
    CONSTRAINT PK_Dependent PRIMARY KEY (DependentID),
    CONSTRAINT CK_Dependent_Gender CHECK (Gender IN (N'Nam', N'Nữ'))
);
GO

-- =====================================================================
-- 3. THIẾT LẬP CÁC KHÓA NGOẠI (FOREIGN KEY CONSTRAINTS)
-- =====================================================================

-- FK từ EMPLOYEE -> DEPARTMENT
ALTER TABLE EMPLOYEE
ADD CONSTRAINT FK_Employee_Department FOREIGN KEY (DepartmentID)
REFERENCES DEPARTMENT (DepartmentID);
GO

-- FK đệ quy từ EMPLOYEE -> EMPLOYEE (Người giám sát)
ALTER TABLE EMPLOYEE
ADD CONSTRAINT FK_Employee_Supervisor FOREIGN KEY (SupervisorID)
REFERENCES EMPLOYEE (EmployeeID);
GO

-- FK từ DEPARTMENT -> EMPLOYEE (Trưởng phòng)
ALTER TABLE DEPARTMENT
ADD CONSTRAINT FK_Department_Manager FOREIGN KEY (ManagerID)
REFERENCES EMPLOYEE (EmployeeID);
GO

-- FK từ PROJECT -> DEPARTMENT
ALTER TABLE PROJECT
ADD CONSTRAINT FK_Project_Department FOREIGN KEY (DepartmentID)
REFERENCES DEPARTMENT (DepartmentID);
GO

-- FK từ WORKS_ON -> EMPLOYEE & PROJECT
ALTER TABLE WORKS_ON
ADD CONSTRAINT FK_WorksOn_Employee FOREIGN KEY (EmployeeID)
REFERENCES EMPLOYEE (EmployeeID) ON DELETE CASCADE;
GO

ALTER TABLE WORKS_ON
ADD CONSTRAINT FK_WorksOn_Project FOREIGN KEY (ProjectID)
REFERENCES PROJECT (ProjectID) ON DELETE CASCADE;
GO

-- FK từ DEPENDENT -> EMPLOYEE
ALTER TABLE DEPENDENT
ADD CONSTRAINT FK_Dependent_Employee FOREIGN KEY (EmployeeID)
REFERENCES EMPLOYEE (EmployeeID) ON DELETE CASCADE;
GO

-- =====================================================================
-- 4. TRIGGER KIỂM SOÁT NGHIỆP VỤ NÂNG CAO
-- =====================================================================

-- Trigger 4.1: Đảm bảo Trưởng phòng phải thuộc chính phòng ban mà mình quản lý
CREATE TRIGGER TRG_Check_Department_Manager
ON DEPARTMENT
AFTER INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN EMPLOYEE e ON i.ManagerID = e.EmployeeID
        WHERE i.ManagerID IS NOT NULL AND i.DepartmentID <> e.DepartmentID
    )
    BEGIN
        RAISERROR (N'Lỗi: Trưởng phòng phải là nhân viên thuộc chính phòng ban đó!', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- =====================================================================
-- 5. CHÈN DỮ LIỆU MẪU (DATA SEEDING)
-- =====================================================================

-- 5.1. Chèn danh mục phòng ban (Tạm thời để ManagerID = NULL để tránh lỗi vòng lặp)
INSERT INTO DEPARTMENT (DepartmentID, DepartmentName, ManagerID, ManagerStartDate, Location) VALUES
('PB01', N'Công nghệ thông tin', NULL, '2020-01-15', N'Tầng 4 - Tòa nhà A'),
('PB02', N'Kế toán & Tài chính', NULL, '2019-05-10', N'Tầng 2 - Tòa nhà A'),
('PB03', N'Marketing & Truyền thông', NULL, '2021-03-01', N'Tầng 3 - Tòa nhà B'),
('PB04', N'Kinh doanh & Bán hàng', NULL, '2018-11-20', N'Tầng 1 - Tòa nhà B'),
('PB05', N'Nhân sự & Hành chính', NULL, '2017-08-01', N'Tầng 5 - Tòa nhà A'),
('PB06', N'Nghiên cứu & Phát triển (R&D)', NULL, '2022-06-15', N'Tầng 6 - Tòa nhà C');
GO

-- 5.2. Chèn 32 Nhân viên (EMPLOYEE)
-- Cấu trúc phân cấp quản lý:
-- NV001 (Giám đốc công ty, Supervisor = NULL)
--  ├── NV002 (Trưởng phòng PB01, Supervisor = NV001)
--  │    ├── NV003, NV004, NV005 (Supervisor = NV002)
--  │    └── NV006 (Supervisor = NV005) -> NV006 lương cao hơn NV005
--  ├── NV007 (Trưởng phòng PB02, Supervisor = NV001)
--  │    └── NV008, NV009, NV010, NV011 (Supervisor = NV007)
--  ├── NV012 (Trưởng phòng PB03, Supervisor = NV001)
--  │    └── NV013, NV014, NV015, NV016 (Supervisor = NV012)
--  ├── NV017 (Trưởng phòng PB04, Supervisor = NV001)
--  │    └── NV018, NV019, NV020, NV021, NV022 (Supervisor = NV017) -> Phòng 6 nhân viên
--  ├── NV023 (Trưởng phòng PB05, Supervisor = NV001)
--  │    └── NV024, NV025, NV026, NV027 (Supervisor = NV023)
--  └── NV028 (Trưởng phòng PB06, Supervisor = NV001)
--       └── NV029, NV030, NV031, NV032 (Supervisor = NV028)

INSERT INTO EMPLOYEE (EmployeeID, FirstName, LastName, Gender, BirthDate, HireDate, Salary, Email, Phone, DepartmentID, SupervisorID) VALUES
-- Ban Giám Đốc
('NV001', N'Huy', N'Nguyễn Quang', N'Nam', '1980-05-12', '2015-01-01', 65000000, 'huy.nguyen@company.com', '0901234567', 'PB05', NULL),

-- Phòng PB01: CNTT (5 nhân viên)
('NV002', N'Hải', N'Trần Đức', N'Nam', '1985-08-20', '2018-03-15', 35000000, 'hai.tran@company.com', '0902345678', 'PB01', 'NV001'),
('NV003', N'Minh', N'Lê Tuấn', N'Nam', '1992-11-14', '2020-06-01', 28000000, 'minh.le@company.com', '0903456789', 'PB01', 'NV002'),
('NV004', N'Thảo', N'Phạm Phương', N'Nữ', '1994-02-28', '2021-09-15', 38000000, 'thao.pham@company.com', '0904567890', 'PB01', 'NV002'), -- Lương cao hơn trưởng phòng NV002
('NV005', N'Nam', N'Hoàng Thành', N'Nam', '1990-07-09', '2019-11-01', 24000000, 'nam.hoang@company.com', '0905678901', 'PB01', 'NV002'),
('NV006', N'Dũng', N'Vũ Tiến', N'Nam', '1996-10-05', '2025-02-10', 27000000, 'dung.vu@company.com', '0906789012', 'PB01', 'NV005'), -- Vào làm 2025, lương > NV005

-- Phòng PB02: Kế toán & Tài chính (5 nhân viên)
('NV007', N'Lan', N'Ngô Thị', N'Nữ', '1983-04-18', '2016-07-01', 32000000, 'lan.ngo@company.com', '0907890123', 'PB02', 'NV001'),
('NV008', N'Hương', N'Đỗ Thu', N'Nữ', '1991-12-25', '2019-04-15', 21000000, 'huong.do@company.com', '0908901234', 'PB02', 'NV007'),
('NV009', N'Trang', N'Bùi Huyền', N'Nữ', '1995-09-30', '2022-01-10', 18000000, 'trang.bui@company.com', '0909012345', 'PB02', 'NV007'),
('NV010', N'Phúc', N'Đặng Hồng', N'Nam', '1997-03-15', '2025-03-01', 16000000, 'phuc.dang@company.com', '0910123456', 'PB02', 'NV007'), -- Vào làm 2025
('NV011', N'Yến', N'Võ Hải', N'Nữ', '1998-06-22', '2023-08-15', 17500000, 'yen.vo@company.com', '0911234567', 'PB02', 'NV007'),

-- Phòng PB03: Marketing & Truyền thông (5 nhân viên)
('NV012', N'Tùng', N'Dương Thanh', N'Nam', '1987-01-10', '2019-02-01', 30000000, 'tung.duong@company.com', '0912345678', 'PB03', 'NV001'),
('NV013', N'Linh', N'Mai Diệu', N'Nữ', '1993-05-19', '2020-10-15', 22000000, 'linh.mai@company.com', '0913456789', 'PB03', 'NV012'),
('NV014', N'Sơn', N'Trịnh Thái', N'Nam', '1990-11-03', '2018-08-20', 25000000, 'son.trinh@company.com', '0914567890', 'PB03', 'NV012'),
('NV015', N'Vy', N'Lý Thảo', N'Nữ', '1999-08-14', '2025-01-05', 15000000, 'vy.ly@company.com', '0915678901', 'PB03', 'NV012'), -- Vào làm 2025
('NV016', N'Hà', N'Phan Thanh', N'Nữ', '1996-04-12', '2022-05-01', 19000000, 'ha.phan@company.com', '0916789012', 'PB03', 'NV012'),

-- Phòng PB04: Kinh doanh & Bán hàng (6 nhân viên)
('NV017', N'Khoa', N'Lương Đăng', N'Nam', '1986-09-08', '2017-05-10', 36000000, 'khoa.luong@company.com', '0917890123', 'PB04', 'NV001'),
('NV018', N'Bình', N'Cao Văn', N'Nam', '1989-12-01', '2018-09-01', 26000000, 'binh.cao@company.com', '0918901234', 'PB04', 'NV017'),
('NV019', N'Kiên', N'Hồ Trung', N'Nam', '1994-07-17', '2021-04-15', 23000000, 'kien.ho@company.com', '0919012345', 'PB04', 'NV017'),
('NV020', N'Nga', N'Tạ Thúy', N'Nữ', '1995-10-29', '2022-07-20', 20000000, 'nga.ta@company.com', '0920123456', 'PB04', 'NV017'),
('NV021', N'Đạt', N'Chu Quốc', N'Nam', '1998-02-14', '2023-11-01', 17000000, 'dat.chu@company.com', '0921234567', 'PB04', 'NV017'),
('NV022', N'Tuyết', N'Đinh Ánh', N'Nữ', '2000-11-20', '2025-04-15', 14500000, 'tuyet.dinh@company.com', '0922345678', 'PB04', 'NV017'), -- Vào làm 2025

-- Phòng PB05: Nhân sự & Hành chính (5 nhân viên)
('NV023', N'Hạnh', N'Vũ Mỹ', N'Nữ', '1984-03-22', '2016-01-15', 31000000, 'hanh.vu@company.com', '0923456789', 'PB05', 'NV001'),
('NV024', N'Cường', N'Đoàn Mạnh', N'Nam', '1991-06-18', '2019-08-10', 22000000, 'cuong.doan@company.com', '0924567890', 'PB05', 'NV023'),
('NV025', N'Mai', N'Trương Ngọc', N'Nữ', '1995-01-30', '2021-12-01', 19500000, 'mai.truong@company.com', '0925678901', 'PB05', 'NV023'),
('NV026', N'Long', N'Lê Hoàng', N'Nam', '1997-08-08', '2023-03-15', 16500000, 'long.le@company.com', '0926789012', 'PB05', 'NV023'), -- Không tham gia dự án nào
('NV027', N'An', N'Nguyễn Bình', N'Nam', '2001-04-05', '2025-05-20', 14000000, 'an.nguyen@company.com', '0927890123', 'PB05', 'NV023'), -- Vào làm 2025, không tham gia dự án nào

-- Phòng PB06: R&D (5 nhân viên - Phòng không phụ trách dự án nào)
('NV028', N'Bách', N'Trần Gia', N'Nam', '1982-10-10', '2017-09-01', 42000000, 'bach.tran@company.com', '0928901234', 'PB06', 'NV001'),
('NV029', N'Quân', N'Phạm Anh', N'Nam', '1992-04-25', '2020-03-01', 29000000, 'quan.pham@company.com', '0929012345', 'PB06', 'NV028'),
('NV030', N'Hải', N'Nguyễn Đức', N'Nam', '1994-12-12', '2022-09-15', 26000000, 'hai.nguyen@company.com', '0930123456', 'PB06', 'NV028'),
('NV031', N'Trang', N'Lê Thu', N'Nữ', '1998-05-03', '2024-01-10', 21000000, 'trang.le@company.com', '0931234567', 'PB06', 'NV028'),
('NV032', N'Đức', N'Vũ Minh', N'Nam', '2000-09-18', '2025-06-01', 18000000, 'duc.vu@company.com', '0932345678', 'PB06', 'NV028'); -- Vào làm 2025, chưa có dự án
GO

-- 5.3. Cập nhật Trưởng phòng cho bảng DEPARTMENT
UPDATE DEPARTMENT SET ManagerID = 'NV002' WHERE DepartmentID = 'PB01';
UPDATE DEPARTMENT SET ManagerID = 'NV007' WHERE DepartmentID = 'PB02';
UPDATE DEPARTMENT SET ManagerID = 'NV012' WHERE DepartmentID = 'PB03';
UPDATE DEPARTMENT SET ManagerID = 'NV017' WHERE DepartmentID = 'PB04';
UPDATE DEPARTMENT SET ManagerID = 'NV023' WHERE DepartmentID = 'PB05';
UPDATE DEPARTMENT SET ManagerID = 'NV028' WHERE DepartmentID = 'PB06';
GO

-- 5.4. Chèn 16 Dự án (PROJECT)
-- Lưu ý: PB06 không phụ trách dự án nào để thỏa yêu cầu truy vấn
INSERT INTO PROJECT (ProjectID, ProjectName, DepartmentID, StartDate, EndDate, Budget, Status) VALUES
('DA01', N'Hệ thống ERP Doanh nghiệp 2.0', 'PB01', '2024-01-15', '2025-12-31', 1500000000, N'Đang thực hiện'),
('DA02', N'Nền tảng E-Commerce B2B', 'PB01', '2024-06-01', '2025-08-30', 850000000, N'Đang thực hiện'),
('DA03', N'Ứng dụng Mobile Banking Core', 'PB01', '2023-03-01', '2024-05-30', 1200000000, N'Hoàn thành'),
('DA04', N'Hạ tầng Cloud & Bảo mật SOC', 'PB01', '2025-02-01', '2026-01-31', 950000000, N'Đang thực hiện'),

('DA05', N'Tự động hóa Báo cáo Tài chính', 'PB02', '2024-03-01', '2024-11-30', 300000000, N'Hoàn thành'),
('DA06', N'Hệ thống Kiểm toán & Thuế nội bộ', 'PB02', '2025-01-10', '2025-09-30', 450000000, N'Đang thực hiện'),

('DA07', N'Chiến dịch Brand Awareness Q3-Q4', 'PB03', '2024-07-01', '2025-06-30', 600000000, N'Đang thực hiện'),
('DA08', N'Tái định vị Thương hiệu 2025', 'PB03', '2025-01-01', '2025-12-31', 750000000, N'Đang thực hiện'),
('DA09', N'Sự kiện Hội nghị Khách hàng VIP', 'PB03', '2024-09-01', '2024-12-15', 250000000, N'Hoàn thành'),
('DA10', N'Viral Video Marketing Series', 'PB03', '2025-03-01', '2025-07-31', 350000000, N'Đang thực hiện'),

('DA11', N'Mở rộng Thị trường Miền Trung', 'PB04', '2024-02-01', '2025-04-30', 800000000, N'Đang thực hiện'),
('DA12', N'Chương trình Kích cầu Đối tác Đại lý', 'PB04', '2024-08-15', '2025-03-31', 500000000, N'Đang thực hiện'),
('DA13', N'Phát triển Kênh Bán lẻ Key Account', 'PB04', '2023-05-01', '2024-04-30', 650000000, N'Hoàn thành'),
('DA14', N'Triển khai CRM Omnichannel', 'PB04', '2025-02-15', '2025-10-31', 400000000, N'Đang thực hiện'),

('DA15', N'Chuẩn hóa Khung Năng lực Nhân sự', 'PB05', '2024-04-01', '2024-10-31', 200000000, N'Hoàn thành'),
('DA16', N'Xây dựng Văn hóa Doanh nghiệp 4.0', 'PB05', '2025-01-15', '2025-12-15', 350000000, N'Đang thực hiện');
GO

-- 5.5. Chèn 62 bản ghi phân công dự án (WORKS_ON)
INSERT INTO WORKS_ON (EmployeeID, ProjectID, AssignedDate, Role, Hours, Allowance) VALUES
-- Dự án DA01 (6 nhân viên tham gia -> thỏa >= 5 người)
('NV002', 'DA01', '2024-01-15', N'Project Director', 180, 15000000),
('NV003', 'DA01', '2024-01-15', N'Lead Architect', 260, 12000000),
('NV004', 'DA01', '2024-02-01', N'Senior Backend Dev', 290, 10000000),
('NV005', 'DA01', '2024-02-01', N'Frontend Dev', 220, 8000000),
('NV006', 'DA01', '2025-02-15', N'Junior QA/QC', 120, 4000000),
('NV028', 'DA01', '2024-03-01', N'AI/ML Consultant', 150, 14000000), -- Nhân viên PB06 làm DA phòng PB01

-- Dự án DA02 (4 nhân viên)
('NV003', 'DA02', '2024-06-01', N'Tech Lead', 210, 9000000),
('NV005', 'DA02', '2024-06-15', N'Frontend Engineer', 190, 7000000),
('NV018', 'DA02', '2024-07-01', N'Business Analyst', 160, 6000000), -- Nhân viên PB04 làm DA phòng PB01
('NV029', 'DA02', '2024-06-01', N'Database Architect', 175, 8500000), -- Nhân viên PB06 làm DA phòng PB01

-- Dự án DA03 (3 nhân viên)
('NV002', 'DA03', '2023-03-01', N'Project Manager', 240, 11000000),
('NV004', 'DA03', '2023-03-15', N'Core Banking Dev', 310, 12500000),
('NV030', 'DA03', '2023-04-01', N'Security Auditor', 180, 9000000),

-- Dự án DA04 (4 nhân viên)
('NV003', 'DA04', '2025-02-01', N'DevOps Specialist', 160, 8000000),
('NV006', 'DA04', '2025-02-15', N'SysAdmin Engineer', 140, 5000000),
('NV030', 'DA04', '2025-02-01', N'Cloud Architect', 200, 10000000),
('NV031', 'DA04', '2025-02-10', N'SecOps Tester', 130, 6000000),

-- Dự án DA05 (3 nhân viên)
('NV007', 'DA05', '2024-03-01', N'Project Leader', 160, 7000000),
('NV008', 'DA05', '2024-03-01', N'Financial Analyst', 190, 6500000),
('NV009', 'DA05', '2024-03-15', N'Accountant Specialist', 170, 5000000),

-- Dự án DA06 (4 nhân viên - NV007 tham gia cả DA05, DA06 -> tham gia tất cả DA phòng mình)
('NV007', 'DA06', '2025-01-10', N'Audit Lead', 180, 8000000),
('NV008', 'DA06', '2025-01-10', N'Tax Specialist', 200, 7500000),
('NV010', 'DA06', '2025-03-01', N'Junior Auditor', 110, 3500000),
('NV011', 'DA06', '2025-01-15', N'Data Analyst', 150, 5500000),

-- Dự án DA07 (5 nhân viên tham gia)
('NV012', 'DA07', '2024-07-01', N'Campaign Manager', 230, 10000000),
('NV013', 'DA07', '2024-07-01', N'Creative Director', 210, 8500000),
('NV014', 'DA07', '2024-07-15', N'Digital Marketer', 250, 9000000),
('NV016', 'DA07', '2024-08-01', N'Content Creator', 180, 6000000),
('NV019', 'DA07', '2024-07-15', N'Sales Coordinator', 140, 5000000), -- Nhân viên PB04

-- Dự án DA08 (4 nhân viên)
('NV012', 'DA08', '2025-01-01', N'Brand Strategist', 190, 8000000),
('NV013', 'DA08', '2025-01-15', N'Senior Designer', 220, 7500000),
('NV014', 'DA08', '2025-01-10', N'Media Planner', 200, 7000000),
('NV015', 'DA08', '2025-01-20', N'Social Executive', 130, 4000000),

-- Dự án DA09 (3 nhân viên)
('NV012', 'DA09', '2024-09-01', N'Event Host', 150, 6000000),
('NV014', 'DA09', '2024-09-01', N'Event Coordinator', 180, 5500000),
('NV024', 'DA09', '2024-09-10', N'Logistics Support', 120, 4000000), -- Nhân viên PB05

-- Dự án DA10 (3 nhân viên)
('NV013', 'DA10', '2025-03-01', N'Video Producer', 170, 6500000),
('NV015', 'DA10', '2025-03-05', N'Assistant Producer', 140, 4500000),
('NV016', 'DA10', '2025-03-01', N'Scriptwriter', 160, 5000000),

-- Dự án DA11 (5 nhân viên tham gia)
('NV017', 'DA11', '2024-02-01', N'Regional Sales Director', 250, 13000000),
('NV018', 'DA11', '2024-02-01', N'Account Executive', 280, 11000000),
('NV019', 'DA11', '2024-02-15', N'Area Sales Manager', 240, 9500000),
('NV020', 'DA11', '2024-03-01', N'Channel Specialist', 210, 8000000),
('NV021', 'DA11', '2024-03-01', N'Sales Representative', 190, 6500000),

-- Dự án DA12 (4 nhân viên)
('NV017', 'DA12', '2024-08-15', N'Partnership Lead', 200, 9000000),
('NV018', 'DA12', '2024-08-15', N'B2B Account Manager', 230, 8500000),
('NV020', 'DA12', '2024-09-01', N'Sales Coordinator', 180, 6000000),
('NV022', 'DA12', '2025-04-15', N'Telesales Support', 110, 3500000),

-- Dự án DA13 (3 nhân viên)
('NV017', 'DA13', '2023-05-01', N'Project Director', 220, 10000000),
('NV019', 'DA13', '2023-05-15', N'Key Account Manager', 270, 9000000),
('NV021', 'DA13', '2023-06-01', N'Sales Specialist', 230, 7500000),

-- Dự án DA14 (4 nhân viên)
('NV003', 'DA14', '2025-02-15', N'CRM Technical Lead', 180, 9000000), -- NV003 tham gia dự án thứ 4
('NV017', 'DA14', '2025-02-15', N'Business Owner', 170, 8000000),
('NV018', 'DA14', '2025-02-20', N'CRM Admin', 190, 7000000),
('NV020', 'DA14', '2025-03-01', N'Customer Care Lead', 150, 5500000),

-- Dự án DA15 (3 nhân viên)
('NV023', 'DA15', '2024-04-01', N'HR Project Lead', 170, 6500000),
('NV024', 'DA15', '2024-04-01', N'C&B Specialist', 190, 6000000),
('NV025', 'DA15', '2024-04-15', N'HR Trainer', 160, 5000000),

-- Dự án DA16 (4 nhân viên)
('NV001', 'DA16', '2025-01-15', N'Executive Sponsor', 100, 10000000),
('NV023', 'DA16', '2025-01-15', N'Culture Lead', 210, 8000000),
('NV024', 'DA16', '2025-02-01', N'Internal Comms', 180, 6000000),
('NV025', 'DA16', '2025-01-20', N'HR Event Officer', 190, 6500000);
GO

-- 5.6. Chèn 24 bản ghi Người phụ thuộc / Con (DEPENDENT)
INSERT INTO DEPENDENT (EmployeeID, FullName, Gender, BirthDate, Relationship) VALUES
('NV001', N'Nguyễn Quang Dũng', N'Nam', '2008-03-15', N'Con'),
('NV001', N'Nguyễn Thảo My', N'Nữ', '2012-07-22', N'Con'),
('NV002', N'Trần Đức Anh', N'Nam', '2014-05-10', N'Con'),
('NV002', N'Trần Minh Châu', N'Nữ', '2018-09-03', N'Con'),
('NV003', N'Lê Tuấn Kiệt', N'Nam', '2020-01-18', N'Con'),
('NV004', N'Phạm Gia Hân', N'Nữ', '2022-11-05', N'Con'),
('NV005', N'Hoàng Bảo Nam', N'Nam', '2017-04-12', N'Con'),
('NV007', N'Đỗ Minh Quân', N'Nam', '2010-08-30', N'Con'),
('NV007', N'Đỗ Thùy Linh', N'Nữ', '2015-12-14', N'Con'),
('NV008', N'Vũ Khánh Vy', N'Nữ', '2019-06-25', N'Con'),
('NV012', N'Dương Thái Hà', N'Nữ', '2016-02-11', N'Con'),
('NV012', N'Dương Thanh Phong', N'Nam', '2021-10-09', N'Con'),
('NV013', N'Bùi Minh Khang', N'Nam', '2023-03-28', N'Con'),
('NV014', N'Trịnh Hải Yến', N'Nữ', '2018-07-19', N'Con'),
('NV017', N'Lương Bảo Ngọc', N'Nữ', '2013-11-20', N'Con'),
('NV017', N'Lương Đăng Khôi', N'Nam', '2017-05-15', N'Con'),
('NV018', N'Cao Thùy Trang', N'Nữ', '2016-08-08', N'Con'),
('NV018', N'Cao Văn Sơn', N'Nam', '2020-12-01', N'Con'),
('NV019', N'Hồ Ngọc Ánh', N'Nữ', '2022-04-14', N'Con'),
('NV023', N'Vũ Mai Phương', N'Nữ', '2011-09-17', N'Con'),
('NV023', N'Vũ Tuấn Đạt', N'Nam', '2016-03-24', N'Con'),
('NV024', N'Đoàn Khánh Linh', N'Nữ', '2019-10-30', N'Con'),
('NV028', N'Trần Hoàng Bách', N'Nam', '2012-01-20', N'Con'),
('NV029', N'Phạm Quỳnh Chi', N'Nữ', '2021-08-15', N'Con');
GO

-- =====================================================================
-- YÊU CẦU 4. CÁC CÂU TRUY VẤN SQL TOÀN DIỆN
-- =====================================================================

-- =====================================================================
-- NHÓM A: TRUY VẤN CƠ BẢN
-- =====================================================================

-- Câu A1: Liệt kê toàn bộ nhân viên.
SELECT * 
FROM EMPLOYEE;
GO

-- Câu A2: Liệt kê họ tên, ngày sinh, lương và phòng ban của nhân viên.
SELECT 
    FullName AS N'Họ và Tên',
    BirthDate AS N'Ngày sinh',
    Salary AS N'Lương',
    DepartmentID AS N'Mã phòng ban'
FROM EMPLOYEE;
GO

-- Câu A3: Tìm nhân viên có lương trên 20 triệu.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    Salary AS N'Lương',
    DepartmentID AS N'Mã phòng ban'
FROM EMPLOYEE
WHERE Salary > 20000000;
GO

-- Câu A4: Tìm nhân viên vào làm trong năm 2025.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    HireDate AS N'Ngày vào làm',
    Salary AS N'Lương',
    DepartmentID AS N'Mã phòng ban'
FROM EMPLOYEE
WHERE YEAR(HireDate) = 2025;
GO

-- Câu A5: Tìm các dự án đang thực hiện.
SELECT 
    ProjectID AS N'Mã DA',
    ProjectName AS N'Tên dự án',
    DepartmentID AS N'Phòng phụ trách',
    StartDate AS N'Ngày bắt đầu',
    EndDate AS N'Ngày kết thúc',
    Budget AS N'Ngân sách',
    Status AS N'Trạng thái'
FROM PROJECT
WHERE Status = N'Đang thực hiện';
GO

-- Câu A6: Tìm các dự án do phòng ban 'PB01' phụ trách.
SELECT 
    ProjectID AS N'Mã DA',
    ProjectName AS N'Tên dự án',
    DepartmentID AS N'Phòng phụ trách',
    Budget AS N'Ngân sách',
    Status AS N'Trạng thái'
FROM PROJECT
WHERE DepartmentID = 'PB01';
GO

-- Câu A7: Liệt kê nhân viên theo thứ tự lương giảm dần.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    Salary AS N'Lương',
    DepartmentID AS N'Mã phòng'
FROM EMPLOYEE
ORDER BY Salary DESC;
GO

-- Câu A8: Liệt kê các mức lương khác nhau đang tồn tại trong công ty.
SELECT DISTINCT 
    Salary AS N'Mức lương'
FROM EMPLOYEE
ORDER BY Salary DESC;
GO

-- =====================================================================
-- NHÓM B: TRUY VẤN JOIN
-- =====================================================================

-- Câu B1: Liệt kê nhân viên cùng tên phòng ban.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    e.Salary AS N'Lương',
    d.DepartmentName AS N'Tên phòng ban'
FROM EMPLOYEE e
JOIN DEPARTMENT d ON e.DepartmentID = d.DepartmentID;
GO

-- Câu B2: Liệt kê dự án và tên phòng ban phụ trách.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    p.Budget AS N'Ngân sách',
    d.DepartmentName AS N'Phòng phụ trách'
FROM PROJECT p
JOIN DEPARTMENT d ON p.DepartmentID = d.DepartmentID;
GO

-- Câu B3: Liệt kê tên nhân viên, dự án tham gia, vai trò và số giờ làm việc.
SELECT 
    e.FullName AS N'Tên nhân viên',
    p.ProjectName AS N'Tên dự án',
    w.Role AS N'Vai trò',
    w.Hours AS N'Số giờ làm việc',
    w.Allowance AS N'Phụ cấp'
FROM WORKS_ON w
JOIN EMPLOYEE e ON w.EmployeeID = e.EmployeeID
JOIN PROJECT p ON w.ProjectID = p.ProjectID;
GO

-- Câu B4: Liệt kê thông tin các con cùng họ tên cha/mẹ là nhân viên.
SELECT 
    d.FullName AS N'Tên người con',
    d.Gender AS N'Giới tính',
    d.BirthDate AS N'Ngày sinh con',
    e.FullName AS N'Họ tên Cha/Mẹ',
    e.Email AS N'Email phụ huynh',
    e.DepartmentID AS N'Phòng ban phụ huynh'
FROM DEPENDENT d
JOIN EMPLOYEE e ON d.EmployeeID = e.EmployeeID;
GO

-- Câu B5: Liệt kê tên nhân viên và tên người giám sát trực tiếp.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    ISNULL(s.FullName, N'-- Không có (Giám đốc) --') AS N'Người giám sát trực tiếp'
FROM EMPLOYEE e
LEFT JOIN EMPLOYEE s ON e.SupervisorID = s.EmployeeID;
GO

-- Câu B6: Liệt kê tên trưởng phòng của từng phòng ban.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    e.FullName AS N'Họ tên Trưởng phòng',
    d.ManagerStartDate AS N'Ngày bổ nhiệm'
FROM DEPARTMENT d
LEFT JOIN EMPLOYEE e ON d.ManagerID = e.EmployeeID;
GO

-- Câu B7: Liệt kê các nhân viên tham gia dự án không do phòng ban của mình phụ trách.
SELECT DISTINCT
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    d_emp.DepartmentName AS N'Phòng ban nhân viên',
    p.ProjectName AS N'Dự án tham gia',
    d_proj.DepartmentName AS N'Phòng ban chủ trì dự án',
    w.Role AS N'Vai trò'
FROM WORKS_ON w
JOIN EMPLOYEE e ON w.EmployeeID = e.EmployeeID
JOIN PROJECT p ON w.ProjectID = p.ProjectID
JOIN DEPARTMENT d_emp ON e.DepartmentID = d_emp.DepartmentID
JOIN DEPARTMENT d_proj ON p.DepartmentID = d_proj.DepartmentID
WHERE e.DepartmentID <> p.DepartmentID;
GO

-- =====================================================================
-- NHÓM C: TRUY VẤN GROUP BY / HAVING
-- =====================================================================

-- Câu C1: Đếm số nhân viên của từng phòng.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    COUNT(e.EmployeeID) AS N'Số lượng nhân viên'
FROM DEPARTMENT d
LEFT JOIN EMPLOYEE e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName;
GO

-- Câu C2: Tính lương trung bình của từng phòng.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    AVG(e.Salary) AS N'Lương trung bình'
FROM DEPARTMENT d
JOIN EMPLOYEE e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName;
GO

-- Câu C3: Tìm phòng ban có mức lương trung bình cao nhất.
SELECT TOP 1 WITH TIES
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    AVG(e.Salary) AS N'Lương trung bình cao nhất'
FROM DEPARTMENT d
JOIN EMPLOYEE e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName
ORDER BY AVG(e.Salary) DESC;
GO

-- Câu C4: Đếm số dự án do từng phòng phụ trách.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    COUNT(p.ProjectID) AS N'Số lượng dự án'
FROM DEPARTMENT d
LEFT JOIN PROJECT p ON d.DepartmentID = p.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName;
GO

-- Câu C5: Tính tổng số giờ mà mỗi nhân viên đã làm trên tất cả dự án.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ tên nhân viên',
    SUM(w.Hours) AS N'Tổng số giờ làm'
FROM EMPLOYEE e
JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
GROUP BY e.EmployeeID, e.FullName;
GO

-- Câu C6: Tính tổng số giờ thực hiện của từng dự án.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    SUM(w.Hours) AS N'Tổng số giờ thực hiện'
FROM PROJECT p
JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName;
GO

-- Câu C7: Tìm số người tham gia từng dự án.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    COUNT(w.EmployeeID) AS N'Số người tham gia'
FROM PROJECT p
LEFT JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName;
GO

-- Câu C8: Tìm các dự án có ít nhất 5 nhân viên tham gia.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    COUNT(w.EmployeeID) AS N'Số lượng thành viên'
FROM PROJECT p
JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName
HAVING COUNT(w.EmployeeID) >= 5;
GO

-- Câu C9: Tìm các phòng có ít nhất 6 nhân viên.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban',
    COUNT(e.EmployeeID) AS N'Số nhân viên'
FROM DEPARTMENT d
JOIN EMPLOYEE e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName
HAVING COUNT(e.EmployeeID) >= 6;
GO

-- Câu C10: Tìm nhân viên tham gia từ 3 dự án trở lên.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    COUNT(w.ProjectID) AS N'Số dự án tham gia'
FROM EMPLOYEE e
JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
GROUP BY e.EmployeeID, e.FullName
HAVING COUNT(w.ProjectID) >= 3;
GO

-- =====================================================================
-- NHÓM D: SUBQUERY (TRUY VẤN CON)
-- =====================================================================

-- Câu D1: Tìm nhân viên có lương cao hơn lương trung bình toàn công ty.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    Salary AS N'Lương'
FROM EMPLOYEE
WHERE Salary > (SELECT AVG(Salary) FROM EMPLOYEE);
GO

-- Câu D2: Tìm nhân viên có lương cao hơn lương trung bình của chính phòng ban mình.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.Salary AS N'Lương',
    e.DepartmentID AS N'Mã phòng'
FROM EMPLOYEE e
WHERE e.Salary > (
    SELECT AVG(e2.Salary)
    FROM EMPLOYEE e2
    WHERE e2.DepartmentID = e.DepartmentID
);
GO

-- Câu D3: Tìm nhân viên có mức lương cao nhất trong công ty.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    Salary AS N'Lương'
FROM EMPLOYEE
WHERE Salary = (SELECT MAX(Salary) FROM EMPLOYEE);
GO

-- Câu D4: Tìm nhân viên có mức lương cao nhất của từng phòng.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.DepartmentID AS N'Mã phòng',
    e.Salary AS N'Lương cao nhất phòng'
FROM EMPLOYEE e
WHERE e.Salary = (
    SELECT MAX(e2.Salary)
    FROM EMPLOYEE e2
    WHERE e2.DepartmentID = e.DepartmentID
);
GO

-- Câu D5: Tìm dự án có nhiều nhân viên tham gia nhất.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    COUNT(w.EmployeeID) AS N'Số lượng nhân viên tham gia'
FROM PROJECT p
JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName
HAVING COUNT(w.EmployeeID) = (
    SELECT MAX(MemberCount)
    FROM (
        SELECT COUNT(EmployeeID) AS MemberCount
        FROM WORKS_ON
        GROUP BY ProjectID
    ) AS T
);
GO

-- Câu D6: Tìm nhân viên có tổng số giờ làm dự án lớn nhất.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    SUM(w.Hours) AS N'Tổng số giờ lớn nhất'
FROM EMPLOYEE e
JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
GROUP BY e.EmployeeID, e.FullName
HAVING SUM(w.Hours) = (
    SELECT MAX(TotalHours)
    FROM (
        SELECT SUM(Hours) AS TotalHours
        FROM WORKS_ON
        GROUP BY EmployeeID
    ) AS T
);
GO

-- Câu D7: Tìm những nhân viên chưa tham gia dự án nào.
SELECT 
    EmployeeID AS N'Mã NV',
    FullName AS N'Tên nhân viên',
    DepartmentID AS N'Phòng ban'
FROM EMPLOYEE
WHERE EmployeeID NOT IN (SELECT DISTINCT EmployeeID FROM WORKS_ON);
GO

-- Câu D8: Tìm những phòng ban chưa phụ trách dự án nào.
SELECT 
    DepartmentID AS N'Mã phòng',
    DepartmentName AS N'Tên phòng ban'
FROM DEPARTMENT
WHERE DepartmentID NOT IN (SELECT DISTINCT DepartmentID FROM PROJECT);
GO

-- =====================================================================
-- NHÓM E: EXISTS / NOT EXISTS
-- =====================================================================

-- Câu E1: Tìm nhân viên có ít nhất một người con.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.DepartmentID AS N'Phòng ban'
FROM EMPLOYEE e
WHERE EXISTS (
    SELECT 1 
    FROM DEPENDENT d 
    WHERE d.EmployeeID = e.EmployeeID
);
GO

-- Câu E2: Tìm nhân viên không có người con nào.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.DepartmentID AS N'Phòng ban'
FROM EMPLOYEE e
WHERE NOT EXISTS (
    SELECT 1 
    FROM DEPENDENT d 
    WHERE d.EmployeeID = e.EmployeeID
);
GO

-- Câu E3: Tìm nhân viên có tham gia ít nhất một dự án do phòng khác phụ trách.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.DepartmentID AS N'Phòng của NV'
FROM EMPLOYEE e
WHERE EXISTS (
    SELECT 1 
    FROM WORKS_ON w
    JOIN PROJECT p ON w.ProjectID = p.ProjectID
    WHERE w.EmployeeID = e.EmployeeID AND p.DepartmentID <> e.DepartmentID
);
GO

-- Câu E4: Tìm các dự án mà không có nhân viên thuộc phòng phụ trách dự án tham gia.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    p.DepartmentID AS N'Phòng phụ trách dự án'
FROM PROJECT p
WHERE NOT EXISTS (
    SELECT 1 
    FROM WORKS_ON w
    JOIN EMPLOYEE e ON w.EmployeeID = e.EmployeeID
    WHERE w.ProjectID = p.ProjectID AND e.DepartmentID = p.DepartmentID
);
GO

-- Câu E5: Tìm các phòng ban mà tất cả nhân viên đều đã tham gia ít nhất một dự án.
SELECT 
    d.DepartmentID AS N'Mã phòng',
    d.DepartmentName AS N'Tên phòng ban'
FROM DEPARTMENT d
WHERE NOT EXISTS (
    SELECT 1 
    FROM EMPLOYEE e
    WHERE e.DepartmentID = d.DepartmentID
      AND NOT EXISTS (
          SELECT 1 
          FROM WORKS_ON w 
          WHERE w.EmployeeID = e.EmployeeID
      )
);
GO

-- =====================================================================
-- NHÓM F: TRUY VẤN NÂNG CAO & XẾP HẠNG
-- =====================================================================

-- Câu F1: Tìm nhân viên tham gia tất cả các dự án do phòng mình phụ trách (Phép chia quan hệ).
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    e.DepartmentID AS N'Mã phòng'
FROM EMPLOYEE e
WHERE NOT EXISTS (
    -- Tập các dự án do phòng e.DepartmentID phụ trách
    SELECT p.ProjectID 
    FROM PROJECT p 
    WHERE p.DepartmentID = e.DepartmentID
    EXCEPT
    -- Tập các dự án mà nhân viên e tham gia
    SELECT w.ProjectID 
    FROM WORKS_ON w 
    WHERE w.EmployeeID = e.EmployeeID
)
AND EXISTS (SELECT 1 FROM PROJECT p2 WHERE p2.DepartmentID = e.DepartmentID);
GO

-- Câu F2: Tìm nhân viên tham gia nhiều dự án nhất.
SELECT TOP 1 WITH TIES
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    COUNT(w.ProjectID) AS N'Số lượng dự án tham gia'
FROM EMPLOYEE e
JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
GROUP BY e.EmployeeID, e.FullName
ORDER BY COUNT(w.ProjectID) DESC;
GO

-- Câu F3: Tìm nhân viên có tổng số giờ cao nhất trong từng phòng.
WITH EmpHoursByDept AS (
    SELECT 
        e.DepartmentID,
        e.EmployeeID,
        e.FullName,
        SUM(w.Hours) AS TotalHours,
        RANK() OVER (PARTITION BY e.DepartmentID ORDER BY SUM(w.Hours) DESC) AS RankNum
    FROM EMPLOYEE e
    JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
    GROUP BY e.DepartmentID, e.EmployeeID, e.FullName
)
SELECT 
    DepartmentID AS N'Mã phòng',
    EmployeeID AS N'Mã NV',
    FullName AS N'Tên nhân viên',
    TotalHours AS N'Tổng số giờ cao nhất phòng'
FROM EmpHoursByDept
WHERE RankNum = 1;
GO

-- Câu F4: Tìm dự án có tổng chi phí phụ cấp nhân viên cao nhất.
SELECT TOP 1 WITH TIES
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    SUM(w.Allowance) AS N'Tổng chi phí phụ cấp'
FROM PROJECT p
JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName
ORDER BY SUM(w.Allowance) DESC;
GO

-- Câu F5: Tìm 3 nhân viên có tổng số giờ dự án cao nhất.
SELECT TOP 3 WITH TIES
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    SUM(w.Hours) AS N'Tổng số giờ làm'
FROM EMPLOYEE e
JOIN WORKS_ON w ON e.EmployeeID = w.EmployeeID
GROUP BY e.EmployeeID, e.FullName
ORDER BY SUM(w.Hours) DESC;
GO

-- Câu F6: Với mỗi phòng ban, tìm 2 nhân viên có mức lương cao nhất.
WITH RankedSalaries AS (
    SELECT 
        DepartmentID,
        EmployeeID,
        FullName,
        Salary,
        DENSE_RANK() OVER (PARTITION BY DepartmentID ORDER BY Salary DESC) AS RankNum
    FROM EMPLOYEE
)
SELECT 
    DepartmentID AS N'Mã phòng',
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên',
    Salary AS N'Lương',
    RankNum AS N'Thứ hạng lương'
FROM RankedSalaries
WHERE RankNum <= 2
ORDER BY DepartmentID, RankNum;
GO

-- Câu F7: Xếp hạng nhân viên trong từng phòng theo mức lương.
SELECT 
    e.DepartmentID AS N'Mã phòng',
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Họ và Tên',
    e.Salary AS N'Lương',
    DENSE_RANK() OVER (PARTITION BY e.DepartmentID ORDER BY e.Salary DESC) AS N'Xếp hạng trong phòng'
FROM EMPLOYEE e
ORDER BY e.DepartmentID, e.Salary DESC;
GO

-- Câu F8: Xếp hạng các dự án theo tổng số giờ thực hiện.
SELECT 
    p.ProjectID AS N'Mã DA',
    p.ProjectName AS N'Tên dự án',
    SUM(w.Hours) AS N'Tổng số giờ thực hiện',
    RANK() OVER (ORDER BY SUM(w.Hours) DESC) AS N'Thứ hạng giờ làm'
FROM PROJECT p
JOIN WORKS_ON w ON p.ProjectID = w.ProjectID
GROUP BY p.ProjectID, p.ProjectName
ORDER BY SUM(w.Hours) DESC;
GO

-- Câu F9: Tìm nhân viên có mức lương lớn hơn người giám sát trực tiếp.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    e.Salary AS N'Lương nhân viên',
    s.FullName AS N'Tên người giám sát',
    s.Salary AS N'Lương người giám sát'
FROM EMPLOYEE e
JOIN EMPLOYEE s ON e.SupervisorID = s.EmployeeID
WHERE e.Salary > s.Salary;
GO

-- Câu F10: Tìm nhân viên có số dự án tham gia lớn hơn người giám sát của mình.
WITH ProjectCount AS (
    SELECT EmployeeID, COUNT(ProjectID) AS NumProjects
    FROM WORKS_ON
    GROUP BY EmployeeID
)
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    ISNULL(pc_e.NumProjects, 0) AS N'Số DA của nhân viên',
    s.FullName AS N'Tên người giám sát',
    ISNULL(pc_s.NumProjects, 0) AS N'Số DA của giám sát'
FROM EMPLOYEE e
JOIN EMPLOYEE s ON e.SupervisorID = s.EmployeeID
LEFT JOIN ProjectCount pc_e ON e.EmployeeID = pc_e.EmployeeID
LEFT JOIN ProjectCount pc_s ON s.EmployeeID = pc_s.EmployeeID
WHERE ISNULL(pc_e.NumProjects, 0) > ISNULL(pc_s.NumProjects, 0);
GO

-- Câu F11: Tìm người giám sát có số nhân viên cấp dưới trực tiếp nhiều nhất.
SELECT TOP 1 WITH TIES
    s.EmployeeID AS N'Mã người giám sát',
    s.FullName AS N'Tên người giám sát',
    COUNT(e.EmployeeID) AS N'Số nhân viên trực thuộc'
FROM EMPLOYEE s
JOIN EMPLOYEE e ON s.EmployeeID = e.SupervisorID
GROUP BY s.EmployeeID, s.FullName
ORDER BY COUNT(e.EmployeeID) DESC;
GO

-- Câu F12: Tìm các nhân viên không phải trưởng phòng nhưng có lương lớn hơn trưởng phòng của mình.
SELECT 
    e.EmployeeID AS N'Mã NV',
    e.FullName AS N'Tên nhân viên',
    e.Salary AS N'Lương nhân viên',
    d.DepartmentName AS N'Phòng ban',
    mgr.FullName AS N'Tên trưởng phòng',
    mgr.Salary AS N'Lương trưởng phòng'
FROM EMPLOYEE e
JOIN DEPARTMENT d ON e.DepartmentID = d.DepartmentID
JOIN EMPLOYEE mgr ON d.ManagerID = mgr.EmployeeID
WHERE e.EmployeeID <> d.ManagerID AND e.Salary > mgr.Salary;
GO

-- =====================================================================
-- NHÓM G: TRUY VẤN ĐỆ QUY (RECURSIVE CTE)
-- =====================================================================

-- Câu G1: Với một nhân viên bất kỳ (ví dụ 'NV006'), tìm toàn bộ chuỗi người giám sát từ nhân viên đó lên đến giám đốc.
WITH SupervisorHierarchy AS (
    -- Anchor Member: Nhân viên ban đầu
    SELECT 
        EmployeeID,
        FullName,
        SupervisorID,
        1 AS LevelOrder
    FROM EMPLOYEE
    WHERE EmployeeID = 'NV006'

    UNION ALL

    -- Recursive Member: Tìm cấp giám sát cao hơn
    SELECT 
        e.EmployeeID,
        e.FullName,
        e.SupervisorID,
        sh.LevelOrder + 1
    FROM EMPLOYEE e
    JOIN SupervisorHierarchy sh ON e.EmployeeID = sh.SupervisorID
)
SELECT 
    LevelOrder AS N'Cấp bậc',
    EmployeeID AS N'Mã NV',
    FullName AS N'Họ và Tên'
FROM SupervisorHierarchy
ORDER BY LevelOrder;
GO

-- Câu G2: Với một người quản lý (ví dụ 'NV002'), tìm toàn bộ nhân viên cấp dưới trực tiếp và gián tiếp.
WITH SubordinateHierarchy AS (
    -- Anchor Member: Cấp dưới trực tiếp của người quản lý
    SELECT 
        EmployeeID,
        FullName,
        SupervisorID,
        DepartmentID,
        1 AS LevelNum
    FROM EMPLOYEE
    WHERE SupervisorID = 'NV002'

    UNION ALL

    -- Recursive Member: Cấp dưới của các nhân viên cấp dưới
    SELECT 
        e.EmployeeID,
        e.FullName,
        e.SupervisorID,
        e.DepartmentID,
        sh.LevelNum + 1
    FROM EMPLOYEE e
    JOIN SubordinateHierarchy sh ON e.SupervisorID = sh.EmployeeID
)
SELECT 
    LevelNum AS N'Cấp dưới thứ',
    EmployeeID AS N'Mã NV',
    FullName AS N'Tên nhân viên cấp dưới',
    SupervisorID AS N'Mã người giám sát trực tiếp',
    DepartmentID AS N'Phòng ban'
FROM SubordinateHierarchy
ORDER BY LevelNum, EmployeeID;
GO

-- Câu G3: Hiển thị cây quản lý của toàn công ty dưới dạng trực quan:
-- Giám đốc → Trưởng phòng → Nhân viên → Nhân viên cấp dưới
WITH OrgChart AS (
    -- Anchor Member: Giám đốc cao nhất (SupervisorID IS NULL)
    SELECT 
        EmployeeID,
        FullName,
        SupervisorID,
        DepartmentID,
        0 AS HierarchyLevel,
        CAST(FullName AS NVARCHAR(MAX)) AS ManagementPath
    FROM EMPLOYEE
    WHERE SupervisorID IS NULL

    UNION ALL

    -- Recursive Member: Các cấp nhân viên tiếp theo
    SELECT 
        e.EmployeeID,
        e.FullName,
        e.SupervisorID,
        e.DepartmentID,
        oc.HierarchyLevel + 1,
        CAST(oc.ManagementPath + N'  →  ' + e.FullName AS NVARCHAR(MAX))
    FROM EMPLOYEE e
    JOIN OrgChart oc ON e.SupervisorID = oc.EmployeeID
)
SELECT 
    HierarchyLevel AS N'Cấp quản lý',
    REPLICATE(N'    ', HierarchyLevel) + N'└── ' + FullName AS N'Sơ đồ phân cấp nhân sự',
    EmployeeID AS N'Mã NV',
    DepartmentID AS N'Mã PB',
    ManagementPath AS N'Chuỗi quản lý từ Giám Đốc'
FROM OrgChart
ORDER BY ManagementPath;
GO
