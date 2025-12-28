import { formatCurrency, formatDate } from './utils.js';
import { getActiveUsers } from './users.js';
import { getAllAttendance } from './attendance.js';
import { getAllIncome } from './income.js';
import { Storage, STORAGE_KEYS } from './storage.js';

// Variables para gráficos
let affiliationChart = null;
let attendanceChart = null;
let incomeMonthlyChart = null;

// Inicializar reportes
export function initReports() {
    // Configurar event listeners
    setupReportsEventListeners();
    
    // Actualizar estadísticas iniciales
    updateReportsStatistics();
    
    // Actualizar gráficos
    updateCharts();
}

// Configurar event listeners para reportes
function setupReportsEventListeners() {
    // Generar informe de asistencias mensuales
    const generateAttendanceReport = document.getElementById('generateAttendanceReport');
    if (generateAttendanceReport) {
        generateAttendanceReport.addEventListener('click', generateAttendanceMonthlyReport);
    }
    
    // Generar informe de pagos mensuales
    const generateIncomeReport = document.getElementById('generateIncomeReport');
    if (generateIncomeReport) {
        generateIncomeReport.addEventListener('click', generateIncomeMonthlyReport);
    }
    
    // Exportar informe de asistencias
    const exportAttendanceReport = document.getElementById('exportAttendanceReport');
    if (exportAttendanceReport) {
        exportAttendanceReport.addEventListener('click', exportAttendanceReportToExcel);
    }
    
    // Exportar informe de pagos
    const exportIncomeReport = document.getElementById('exportIncomeReport');
    if (exportIncomeReport) {
        exportIncomeReport.addEventListener('click', exportIncomeReportToExcel);
    }
    
    // Generar reporte combinado
    const generateCombinedReport = document.getElementById('generateCombinedReport');
    if (generateCombinedReport) {
        generateCombinedReport.addEventListener('click', generateCombinedReport);
    }
    
    // Exportar reporte combinado
    const exportCombinedReport = document.getElementById('exportCombinedReport');
    if (exportCombinedReport) {
        exportCombinedReport.addEventListener('click', exportCombinedReportToExcel);
    }
}

// Actualizar estadísticas de reportes
function updateReportsStatistics() {
    const users = getActiveUsers();
    const attendance = getAllAttendance();
    const income = getAllIncome();
    
    // Total usuarios activos
    const reportTotalUsers = document.getElementById('reportTotalUsers');
    if (reportTotalUsers) {
        reportTotalUsers.textContent = users.length;
    }
    
    // Ingresos mensuales
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthlyIncome = income
        .filter(i => i.paymentDate >= firstDay && i.paymentDate <= lastDay)
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
    
    const reportTotalIncome = document.getElementById('reportTotalIncome');
    if (reportTotalIncome) {
        reportTotalIncome.textContent = formatCurrency(monthlyIncome);
    }
    
    // Tasa de asistencia
    const totalAttendance = attendance.filter(a => a.status === 'presente').length;
    const possibleAttendance = users.length * 20; // Estimación de 20 días por mes
    const attendanceRate = possibleAttendance > 0 ? Math.round((totalAttendance / possibleAttendance) * 100) : 0;
    
    const reportAttendanceRate = document.getElementById('reportAttendanceRate');
    if (reportAttendanceRate) {
        reportAttendanceRate.textContent = `${attendanceRate}%`;
    }
    
    // Paquetes completados
    const packagesCompleted = users.filter(u => u.affiliationType === 'paquete 10 clases').length;
    const reportPackagesCompleted = document.getElementById('reportPackagesCompleted');
    if (reportPackagesCompleted) {
        reportPackagesCompleted.textContent = packagesCompleted;
    }
}

// Actualizar gráficos
function updateCharts() {
    // Gráfico de distribución por tipo de afiliación
    updateAffiliationChart();
    
    // Gráfico de asistencia por clase
    updateAttendanceChart();
}

// Gráfico de distribución por tipo de afiliación
function updateAffiliationChart() {
    const ctx = document.getElementById('affiliationChart');
    if (!ctx) return;
    
    const users = getActiveUsers();
    const affiliationTypes = {};
    
    users.forEach(user => {
        const type = user.affiliationType || 'Sin especificar';
        affiliationTypes[type] = (affiliationTypes[type] || 0) + 1;
    });
    
    // Destruir gráfico existente si lo hay
    if (affiliationChart) {
        affiliationChart.destroy();
    }
    
    const chartContext = ctx.getContext('2d');
    affiliationChart = new Chart(chartContext, {
        type: 'doughnut',
        data: {
            labels: Object.keys(affiliationTypes),
            datasets: [{
                data: Object.values(affiliationTypes),
                backgroundColor: [
                    '#27F9D4', '#FF729F', '#7C77B9', '#1D8A99', '#F0F66E',
                    '#5C80BC', '#F7934C', '#4C5B5C', '#FF9F1C', '#A4036F'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8f9fa',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de asistencia por clase
function updateAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    const classTimes = ["5:00 am", "6:00 am", "7:00 am", "8:00 am", "4:00 pm", "5:30 pm", "6:30 pm", "7:30 pm"];
    const classAttendance = {};
    const attendance = getAllAttendance();
    const users = getActiveUsers();
    
    classTimes.forEach(classTime => {
        classAttendance[classTime] = attendance.filter(a => {
            const user = users.find(u => u.id == a.userId);
            return user && user.classTime === classTime && a.status === 'presente';
        }).length;
    });
    
    // Destruir gráfico existente si lo hay
    if (attendanceChart) {
        attendanceChart.destroy();
    }
    
    const chartContext = ctx.getContext('2d');
    attendanceChart = new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: Object.keys(classAttendance),
            datasets: [{
                label: 'Asistencias',
                data: Object.values(classAttendance),
                backgroundColor: '#27F9D4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#f8f9fa'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#f8f9fa',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Generar informe de asistencias mensuales por usuario
function generateAttendanceMonthlyReport() {
    const monthInput = document.getElementById('attendanceMonth').value;
    if (!monthInput) {
        alert('Por favor, seleccione un mes.');
        return;
    }
    
    // Obtener el primer y último día del mes
    const [year, month] = monthInput.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Obtener usuarios activos
    const activeUsers = getActiveUsers()
        .filter(user => user.affiliationType !== 'Entrenador(a)');
    
    // Calcular asistencias por usuario
    const attendance = getAllAttendance();
    const attendanceByUser = activeUsers.map(user => {
        const userAttendance = attendance.filter(a => 
            a.userId === user.id && 
            a.status === 'presente' &&
            a.date >= startDateStr && 
            a.date <= endDateStr
        ).length;
        
        // Encontrar la última fecha de asistencia
        const lastAttendance = attendance
            .filter(a => a.userId === user.id && a.status === 'presente')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const lastAttendanceDate = lastAttendance ? formatDate(lastAttendance.date) : 'Nunca';
        
        // Calcular días hábiles estimados en el mes
        let businessDays = 0;
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            if (currentDate.getDay() !== 0) {
                businessDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Calcular porcentaje de asistencia
        const attendancePercentage = businessDays > 0 ? Math.round((userAttendance / businessDays) * 100) : 0;
        
        return {
            user: user,
            attendanceCount: userAttendance,
            lastAttendance: lastAttendanceDate,
            attendancePercentage: attendancePercentage,
            businessDays: businessDays
        };
    });
    
    // Ordenar por cantidad de asistencias
    attendanceByUser.sort((a, b) => b.attendanceCount - a.attendanceCount);
    
    // Mostrar resultados en la tabla
    const attendanceMonthlyList = document.getElementById('attendanceMonthlyList');
    if (attendanceMonthlyList) {
        attendanceMonthlyList.innerHTML = '';
        
        if (attendanceByUser.length === 0) {
            attendanceMonthlyList.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        No hay usuarios activos para mostrar
                    </td>
                </tr>
            `;
            return;
        }
        
        attendanceByUser.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.user.name}</td>
                <td>${item.user.classTime || 'No definida'}</td>
                <td><strong>${item.attendanceCount}</strong> días</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${item.attendancePercentage >= 80 ? 'bg-success' : item.attendancePercentage >= 50 ? 'bg-warning' : 'bg-danger'}" 
                             role="progressbar" 
                             style="width: ${item.attendancePercentage}%;"
                             aria-valuenow="${item.attendancePercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${item.attendancePercentage}%
                        </div>
                    </div>
                </td>
                <td>${item.lastAttendance}</td>
            `;
            attendanceMonthlyList.appendChild(row);
        });
    }
}

// Generar informe de pagos mensuales por tipo
function generateIncomeMonthlyReport() {
    const monthInput = document.getElementById('incomeMonth').value;
    if (!monthInput) {
        alert('Por favor, seleccione un mes.');
        return;
    }
    
    // Obtener el primer y último día del mes
    const [year, month] = monthInput.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Filtrar pagos del mes
    const income = getAllIncome();
    const monthlyPayments = income.filter(payment => 
        payment.paymentDate >= startDateStr && payment.paymentDate <= endDateStr
    );
    
    // Agrupar pagos por tipo
    const paymentsByType = {};
    let totalAmount = 0;
    let totalCount = 0;
    
    monthlyPayments.forEach(payment => {
        const type = payment.paymentType || 'Sin tipo';
        const amount = parseFloat(payment.amount) || 0;
        
        if (!paymentsByType[type]) {
            paymentsByType[type] = {
                count: 0,
                amount: 0
            };
        }
        
        paymentsByType[type].count++;
        paymentsByType[type].amount += amount;
        
        totalCount++;
        totalAmount += amount;
    });
    
    // Convertir a array para ordenar
    const paymentsArray = Object.keys(paymentsByType).map(type => ({
        type: type,
        count: paymentsByType[type].count,
        amount: paymentsByType[type].amount,
        percentage: totalAmount > 0 ? Math.round((paymentsByType[type].amount / totalAmount) * 100) : 0
    }));
    
    // Ordenar por monto
    paymentsArray.sort((a, b) => b.amount - a.amount);
    
    // Mostrar resultados en la tabla
    const incomeMonthlyList = document.getElementById('incomeMonthlyList');
    if (incomeMonthlyList) {
        incomeMonthlyList.innerHTML = '';
        
        if (paymentsArray.length === 0) {
            incomeMonthlyList.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay pagos registrados en este mes
                    </td>
                </tr>
            `;
            
            const totalPaymentsCount = document.getElementById('totalPaymentsCount');
            const totalPaymentsAmount = document.getElementById('totalPaymentsAmount');
            
            if (totalPaymentsCount) totalPaymentsCount.textContent = '0';
            if (totalPaymentsAmount) totalPaymentsAmount.textContent = formatCurrency(0);
            return;
        }
        
        paymentsArray.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.type}</td>
                <td>${item.count}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${item.percentage}%</td>
            `;
            incomeMonthlyList.appendChild(row);
        });
    }
    
    // Actualizar totales
    const totalPaymentsCount = document.getElementById('totalPaymentsCount');
    const totalPaymentsAmount = document.getElementById('totalPaymentsAmount');
    
    if (totalPaymentsCount) totalPaymentsCount.textContent = totalCount;
    if (totalPaymentsAmount) totalPaymentsAmount.textContent = formatCurrency(totalAmount);
    
    // Actualizar gráfico de pagos por tipo
    updateIncomeMonthlyChart(paymentsArray, totalAmount);
}

// Actualizar gráfico de pagos mensuales
function updateIncomeMonthlyChart(paymentsData, totalAmount) {
    const ctx = document.getElementById('incomeMonthlyChart');
    if (!ctx) return;
    
    // Destruir gráfico existente si lo hay
    if (incomeMonthlyChart) {
        incomeMonthlyChart.destroy();
    }
    
    // Preparar datos para el gráfico
    const labels = paymentsData.map(item => item.type);
    const data = paymentsData.map(item => item.amount);
    const percentages = paymentsData.map(item => item.percentage);
    
    const chartContext = ctx.getContext('2d');
    incomeMonthlyChart = new Chart(chartContext, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#27F9D4', '#FF729F', '#7C77B9', '#1D8A99', '#F0F66E',
                    '#5C80BC', '#F7934C', '#4C5B5C', '#FF9F1C', '#A4036F'
                ].slice(0, labels.length),
                borderColor: 'var(--color-dark)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8f9fa',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = percentages[context.dataIndex];
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Generar reporte combinado
function generateCombinedReport() {
    const userId = document.getElementById('combinedReportUser').value;
    const startDate = document.getElementById('combinedReportStartDate').value;
    const endDate = document.getElementById('combinedReportEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Por favor, seleccione un rango de fechas.');
        return;
    }
    
    // Filtrar usuarios
    let users = getActiveUsers()
        .filter(user => user.affiliationType !== 'Entrenador(a)');
    
    if (userId) {
        users = users.filter(u => u.id === userId);
    }
    
    // Generar reporte
    const combinedReportList = document.getElementById('combinedReportList');
    if (combinedReportList) {
        combinedReportList.innerHTML = '';
        
        if (users.length === 0) {
            combinedReportList.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        No hay usuarios activos para mostrar
                    </td>
                </tr>
            `;
            return;
        }
        
        const attendance = getAllAttendance();
        const income = getAllIncome();
        
        users.forEach(user => {
            // Contar asistencias en el rango de fechas
            const userAttendance = attendance.filter(a => 
                a.userId === user.id && 
                a.status === 'presente' &&
                a.date >= startDate && 
                a.date <= endDate
            ).length;
            
            // Obtener último pago del usuario
            const userPayments = income.filter(p => p.userId === user.id);
            let paymentValidity = 'Sin pago';
            let paymentType = '-';
            let paymentAmount = '-';
            
            if (userPayments.length > 0) {
                // Ordenar por fecha de pago descendente
                userPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
                const lastPayment = userPayments[0];
                paymentType = lastPayment.paymentType || user.affiliationType || '-';
                paymentAmount = lastPayment.amount ? formatCurrency(lastPayment.amount) : '-';
                
                // Formatear vigencia del pago
                if (lastPayment.startDate && lastPayment.endDate) {
                    const addOneDay = (date) => {
                        const d = new Date(date);
                        d.setDate(d.getDate() + 1);
                        return d;
                    };
                    paymentValidity = `${formatDate(addOneDay(lastPayment.startDate))} - ${formatDate(addOneDay(lastPayment.endDate))}`;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.phone || '-'}</td>
                <td><strong>${userAttendance}</strong>&nbsp;asistencias</td>
                <td>${paymentValidity}</td>
                <td>${paymentType}</td>
                <td>${paymentAmount}</td>
                <td><span class="badge bg-success">Activo</span></td>
            `;
            combinedReportList.appendChild(row);
        });
    }
}

// Exportar informe de asistencias a Excel
function exportAttendanceReportToExcel() {
    alert('Funcionalidad de exportación de asistencias a Excel');
    // Implementar exportación a Excel usando XLSX
}

// Exportar informe de pagos a Excel
function exportIncomeReportToExcel() {
    alert('Funcionalidad de exportación de pagos a Excel');
    // Implementar exportación a Excel usando XLSX
}

// Exportar reporte combinado a Excel
function exportCombinedReportToExcel() {
    alert('Funcionalidad de exportación de reporte combinado a Excel');
    // Implementar exportación a Excel usando XLSX
}

// Actualizar información del sistema
export function updateSystemInfo() {
    const users = getActiveUsers();
    const attendance = getAllAttendance();
    const income = getAllIncome();
    
    const infoUsers = document.getElementById('infoUsers');
    const infoAttendance = document.getElementById('infoAttendance');
    const infoIncome = document.getElementById('infoIncome');
    const infoLastBackup = document.getElementById('infoLastBackup');
    
    if (infoUsers) infoUsers.textContent = users.length;
    if (infoAttendance) infoAttendance.textContent = attendance.length;
    if (infoIncome) infoIncome.textContent = income.length;
    
    // Usar Storage.get con STORAGE_KEYS
    if (infoLastBackup) {
        const lastBackup = Storage.get(STORAGE_KEYS.LAST_BACKUP);
        infoLastBackup.textContent = lastBackup ? new Date(lastBackup).toLocaleDateString('es-CO') : 'Nunca';
    }
}
