import { initUsers, getAllUsers, reloadUsersFromStorage, getUserById } from './users.js';
import { initAttendance, getAllAttendance, reloadAttendanceFromStorage } from './attendance.js';
import { initIncome, getAllIncome, reloadIncomeFromStorage } from './income.js';
import { initReports, updateSystemInfo } from './reports.js';
import { setupPhoneValidation, showBackupNotification, normalizeDate, formatDateForExcel, cleanRestoredData } from './utils.js';
import { Storage, STORAGE_KEYS } from './storage.js';

// Variables globales compartidas entre módulos
window.appState = {
    pendingPaymentData: null,
    autoBackupInterval: null
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando aplicación modular...");
    
    // Configurar validación de teléfonos
    setupPhoneValidation();

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;

    // Establecer fechas inicial y final para pagos (hoy y 30 días después)
    document.getElementById('startDate').value = today;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    // Configurar fecha inicial para filtros (inicio del mes)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

    document.getElementById('attendanceStartDateFilter').value = firstDayStr;
    document.getElementById('attendanceEndDateFilter').value = today;
    document.getElementById('incomeStartDateFilter').value = firstDayStr;
    document.getElementById('incomeEndDateFilter').value = today;

    // Establecer fechas por defecto para reportes combinados
    document.getElementById('combinedReportStartDate').value = firstDayStr;
    document.getElementById('combinedReportEndDate').value = today;

    // Establecer mes actual para reportes mensuales
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('attendanceMonth').value = currentMonth;
    document.getElementById('incomeMonth').value = currentMonth;

    // Inicializar módulos
    initUsers();
    initAttendance();
    initIncome();
    initReports();
    
    // Configurar event listeners adicionales
    setupAdditionalEventListeners();
    
    // Actualizar información del sistema
    updateSystemInfo();
    
    console.log("Aplicación modular inicializada correctamente");
});

// Configurar event listeners adicionales
function setupAdditionalEventListeners() {
    // Eventos para pestañas
    document.getElementById('attendance-tab').addEventListener('click', function () {
        setTimeout(() => {
            if (window.loadAttendanceByClass) {
                window.loadAttendanceByClass();
            }
            if (window.loadAttendance) {
                window.loadAttendance();
            }
        }, 100);
    });

    document.getElementById('income-tab').addEventListener('click', function () {
        setTimeout(() => {
            if (window.loadIncome) {
                window.loadIncome();
            }
        }, 100);
    });

    document.getElementById('reports-tab').addEventListener('click', function () {
        setTimeout(() => {
            if (window.updateCharts) {
                window.updateCharts();
            }
        }, 100);
    });

    // Respaldar datos
    const backupDataBtn = document.getElementById('backupData');
    if (backupDataBtn) {
        backupDataBtn.addEventListener('click', backupAllData);
    }

    // Restaurar datos
    const restoreDataBtn = document.getElementById('restoreData');
    if (restoreDataBtn) {
        restoreDataBtn.addEventListener('click', restoreDataFromFile);
    }

    // Cambio en el input de archivo para restaurar
    const restoreFileInput = document.getElementById('restoreFile');
    if (restoreFileInput) {
        restoreFileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Ningún archivo seleccionado';
            document.getElementById('selectedFileName').textContent = fileName;
            document.getElementById('restoreData').disabled = !this.files[0];
        });
    }

    // Evento para cambio de fecha inicial en pagos
    document.getElementById('startDate').addEventListener('change', function () {
        if (this.value) {
            const startDate = new Date(this.value);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 30);
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        }
    });
    
    // Evento para reporte combinado
    const generateCombinedReportBtn = document.getElementById('generateCombinedReport');
    if (generateCombinedReportBtn) {
        generateCombinedReportBtn.addEventListener('click', function() {
            if (window.generateCombinedReport) {
                window.generateCombinedReport();
            }
        });
    }

    // Evento para exportar reporte combinado
    const exportCombinedReportBtn = document.getElementById('exportCombinedReport');
    if (exportCombinedReportBtn) {
        exportCombinedReportBtn.addEventListener('click', function() {
            if (window.exportCombinedReportToExcel) {
                window.exportCombinedReportToExcel();
            }
        });
    }
}

// Respaldar todos los datos
function backupAllData() {
    try {
        console.log("Iniciando respaldo de datos...");
        
        const users = getAllUsers();
        const attendance = getAllAttendance();
        const income = getAllIncome();
        
        console.log(`Respaldando: ${users.length} usuarios, ${attendance.length} asistencias, ${income.length} pagos`);
        
        // Crear un libro de trabajo
        const workbook = XLSX.utils.book_new();
        
        // Convertir datos a formato español para el archivo Excel
        const usersSpanish = users.map(user => ({
            'ID': user.id,
            'Nombre': user.name,
            'Documento': user.document || '',
            'Fecha Nacimiento': formatDateForExcel(user.birthdate) || '',
            'Telefono': user.phone || '',
            'EPS': user.eps || '',
            'RH': user.rh || '',
            'Patologia': user.pathology || '',
            'Contacto Emergencia': user.emergencyContact || '',
            'Telefono Emergencia': user.emergencyPhone || '',
            'Clase': user.classTime || '',
            'Tipo Afiliacion': user.affiliationType || '',
            'Estado': user.status || 'active',
            'Fecha Registro': formatDateForExcel(user.createdAt) || ''
        }));
        
        // Para asistencias, necesitamos obtener el nombre del usuario
        const attendanceSpanish = attendance.map(record => {
            const user = getUserById(record.userId) || { name: 'Desconocido' };
            return {
                'ID': record.id,
                'UsuarioID': record.userId,
                'Fecha': formatDateForExcel(record.date),
                'Usuario': user.name,
                'Estado': record.status || 'presente',
                'Fecha Registro': formatDateForExcel(record.registeredAt) || ''
            };
        });
        
        // Para pagos, también necesitamos el nombre del usuario
        const incomeSpanish = income.map(record => {
            const user = getUserById(record.userId) || { name: 'Desconocido' };
            return {
                'ID': record.id,
                'UsuarioID': record.userId,
                'Fecha Pago': formatDateForExcel(record.paymentDate),
                'Fecha Inicio': formatDateForExcel(record.startDate),
                'Fecha Fin': formatDateForExcel(record.endDate),
                'Usuario': user.name,
                'Monto': record.amount,
                'Tipo Pago': record.paymentType || '',
                'Descripción': record.description || '',
                'Fecha Registro': formatDateForExcel(record.registeredAt) || ''
            };
        });
        
        // Hoja de usuarios
        const usersSheet = XLSX.utils.json_to_sheet(usersSpanish);
        XLSX.utils.book_append_sheet(workbook, usersSheet, "Usuarios");
        
        // Hoja de asistencias
        const attendanceSheet = XLSX.utils.json_to_sheet(attendanceSpanish);
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Asistencias");
        
        // Hoja de pagos
        const incomeSheet = XLSX.utils.json_to_sheet(incomeSpanish);
        XLSX.utils.book_append_sheet(workbook, incomeSheet, "Pagos");
        
        // Generar archivo
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
        const filename = `antologia_box23_respaldo_${date}_${time}.xlsx`;
        
        XLSX.writeFile(workbook, filename);
        
        // Guardar fecha del último respaldo
        Storage.set(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
        
        showBackupNotification('Respaldo completado correctamente');
        updateSystemInfo();
        
        console.log("Respaldo completado exitosamente");
    } catch (error) {
        console.error('Error al respaldar datos:', error);
        alert('Error al respaldar datos: ' + error.message);
    }
}

// Restaurar datos desde archivo
function restoreDataFromFile() {
    const fileInput = document.getElementById('restoreFile');
    if (!fileInput.files[0]) {
        alert('Por favor, seleccione un archivo.');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            console.log("Iniciando restauración de datos...");
            
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            console.log("Hojas encontradas:", workbook.SheetNames);
            
            // Obtener hojas
            const usersSheet = workbook.Sheets["Usuarios"];
            const attendanceSheet = workbook.Sheets["Asistencias"];
            const incomeSheet = workbook.Sheets["Pagos"];
            
            if (!usersSheet || !attendanceSheet || !incomeSheet) {
                alert('El archivo no tiene el formato correcto. Debe contener las hojas: Usuarios, Asistencias, Pagos.');
                return;
            }
            
            // Convertir a JSON (manteniendo los nombres originales en español)
            const usersRaw = XLSX.utils.sheet_to_json(usersSheet);
            const attendanceRaw = XLSX.utils.sheet_to_json(attendanceSheet);
            const incomeRaw = XLSX.utils.sheet_to_json(incomeSheet);
            
            console.log(`Datos leídos: ${usersRaw.length} usuarios, ${attendanceRaw.length} asistencias, ${incomeRaw.length} pagos`);
            
            // Limpiar y normalizar datos
            const cleanedUsers = cleanRestoredData(usersRaw, 'users');
            const cleanedAttendance = cleanRestoredData(attendanceRaw, 'attendance');
            const cleanedIncome = cleanRestoredData(incomeRaw, 'income');
            
            console.log(`Datos normalizados: ${cleanedUsers.length} usuarios, ${cleanedAttendance.length} asistencias, ${cleanedIncome.length} pagos`);
            
            // Verificar si se deben reemplazar los datos existentes
            const replaceData = document.getElementById('replaceData').checked;
            
            if (replaceData) {
                console.log("Reemplazando datos existentes...");
                
                // Sobrescribir datos
                Storage.set(STORAGE_KEYS.USERS, cleanedUsers);
                Storage.set(STORAGE_KEYS.ATTENDANCE, cleanedAttendance);
                Storage.set(STORAGE_KEYS.INCOME, cleanedIncome);
            } else {
                console.log("Fusionando con datos existentes...");
                
                // Fusionar datos
                const existingUsers = Storage.get(STORAGE_KEYS.USERS, []);
                const existingAttendance = Storage.get(STORAGE_KEYS.ATTENDANCE, []);
                const existingIncome = Storage.get(STORAGE_KEYS.INCOME, []);
                
                // Fusionar usuarios: evitar duplicados por id
                const mergedUsers = [...existingUsers];
                cleanedUsers.forEach(newUser => {
                    if (!existingUsers.find(u => u.id == newUser.id)) {
                        mergedUsers.push(newUser);
                    }
                });
                
                // Fusionar asistencias y pagos: agregar todos los nuevos
                const mergedAttendance = [...existingAttendance, ...cleanedAttendance];
                const mergedIncome = [...existingIncome, ...cleanedIncome];
                
                Storage.set(STORAGE_KEYS.USERS, mergedUsers);
                Storage.set(STORAGE_KEYS.ATTENDANCE, mergedAttendance);
                Storage.set(STORAGE_KEYS.INCOME, mergedIncome);
                
                console.log(`Fusión completada: ${mergedUsers.length} usuarios totales`);
            }
            
            // Recargar los datos en los módulos
            reloadUsersFromStorage();
            reloadAttendanceFromStorage();
            reloadIncomeFromStorage();
            
            // Actualizar información del sistema
            updateSystemInfo();
            
            // Limpiar el input de archivo
            fileInput.value = '';
            document.getElementById('selectedFileName').textContent = 'Ningún archivo seleccionado';
            document.getElementById('restoreData').disabled = true;
            document.getElementById('replaceData').checked = false;
            
            alert('Datos restaurados correctamente.');
            console.log("Restauración completada exitosamente");
            
        } catch (error) {
            console.error('Error al restaurar datos:', error);
            alert('Error al restaurar datos. Verifique el formato del archivo.\n\nError: ' + error.message);
        }
    };
    
    reader.onerror = function(error) {
        console.error('Error al leer el archivo:', error);
        alert('Error al leer el archivo.');
    };
    
    reader.readAsArrayBuffer(file);
}

// Exponer funciones globales
window.backupAllData = backupAllData;
window.restoreDataFromFile = restoreDataFromFile;
