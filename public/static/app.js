// ============================================
// SISTEMA DE TIMESHEET - FRONTEND
// ============================================

// Configuração do Axios
axios.defaults.baseURL = '/api';

// Estado da aplicação
const app = {
  currentUser: null,
  token: null,
  currentView: 'login'
};

// Gerenciamento de token
function setToken(token) {
  app.token = token;
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function getToken() {
  const token = localStorage.getItem('token');
  if (token) {
    setToken(token);
  }
  return token;
}

function removeToken() {
  app.token = null;
  app.currentUser = null;
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
}

// ============================================
// FUNÇÕES DE RENDERIZAÇÃO
// ============================================

function render(view) {
  const appDiv = document.getElementById('app');
  
  switch(view) {
    case 'login':
      appDiv.innerHTML = getLoginHTML();
      setupLoginHandlers();
      break;
    case 'dashboard':
      appDiv.innerHTML = getDashboardHTML();
      setupDashboardHandlers();
      loadDashboardData();
      break;
    default:
      appDiv.innerHTML = '<p>Página não encontrada</p>';
  }
}

// ============================================
// TELA DE LOGIN
// ============================================

function getLoginHTML() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-clock text-5xl text-blue-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800">Sistema de Timesheet</h1>
          <p class="text-gray-600 mt-2">Faça login para continuar</p>
        </div>
        
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fas fa-envelope mr-2"></i>Email
            </label>
            <input 
              type="email" 
              id="email" 
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu.email@empresa.com.br"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fas fa-lock mr-2"></i>Senha
            </label>
            <input 
              type="password" 
              id="password" 
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="********"
            />
          </div>
          
          <div id="loginError" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span id="loginErrorMsg"></span>
          </div>
          
          <button 
            type="submit" 
            id="loginBtn"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>
            Entrar
          </button>
        </form>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-gray-700 font-semibold mb-2">👥 Usuários de teste:</p>
          <div class="text-xs text-gray-600 space-y-1">
            <p><strong>Diretor:</strong> carlos.silva@empresa.com.br</p>
            <p><strong>Gestor:</strong> ana.santos@empresa.com.br</p>
            <p><strong>Colaborador:</strong> joao.oliveira@empresa.com.br</p>
            <p class="mt-2"><strong>Senha:</strong> senha123 (todos)</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupLoginHandlers() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Entrando...';
  errorDiv.classList.add('hidden');
  
  try {
    const response = await axios.post('/auth/login', { email, password });
    
    if (response.data.success) {
      setToken(response.data.data.token);
      app.currentUser = response.data.data.user;
      render('dashboard');
    }
  } catch (error) {
    const message = error.response?.data?.error || 'Erro ao fazer login';
    document.getElementById('loginErrorMsg').textContent = message;
    errorDiv.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Entrar';
  }
}

// ============================================
// DASHBOARD
// ============================================

function getDashboardHTML() {
  const user = app.currentUser;
  const roleText = {
    'COLABORADOR': 'Colaborador',
    'GESTOR': 'Gestor',
    'DIRETOR': 'Diretor'
  };
  
  return `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <i class="fas fa-clock text-3xl text-blue-600"></i>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">Sistema de Timesheet</h1>
              <p class="text-sm text-gray-600">Bem-vindo, ${user.full_name}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-700">${user.full_name}</p>
              <p class="text-xs text-gray-500">
                <i class="fas fa-id-badge mr-1"></i>${roleText[user.role]}
              </p>
            </div>
            <button onclick="handleLogout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <i class="fas fa-sign-out-alt mr-2"></i>Sair
            </button>
          </div>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Dashboard Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Card 1: Horas da Semana -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Horas desta Semana</p>
                <p class="text-3xl font-bold text-blue-600" id="weekHours">0.00h</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-calendar-week text-2xl text-blue-600"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">Meta: 40h semanais</p>
          </div>
          
          <!-- Card 2: Horas do Mês -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Horas deste Mês</p>
                <p class="text-3xl font-bold text-green-600" id="monthHours">0.00h</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-calendar-alt text-2xl text-green-600"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">Progresso mensal</p>
          </div>
          
          <!-- Card 3: Pendências -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Pendências</p>
                <p class="text-3xl font-bold text-orange-600" id="pendingItems">0</p>
              </div>
              <div class="bg-orange-100 p-3 rounded-full">
                <i class="fas fa-exclamation-triangle text-2xl text-orange-600"></i>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2" id="pendingText">Itens para revisar</p>
          </div>
        </div>
        
        <!-- Status Summary -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-chart-bar mr-2"></i>Resumo de Status
          </h2>
          <div id="statusSummary" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <!-- Status cards will be inserted here -->
          </div>
        </div>
        
        <!-- Funcionalidades -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${user.role === 'COLABORADOR' ? `
            <div onclick="renderTimesheetView()" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-plus-circle text-4xl text-blue-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Lançar Horas</h3>
              <p class="text-sm text-gray-600">Registre suas horas trabalhadas</p>
            </div>
            
            <div onclick="renderTimesheetView()" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-calendar-check text-4xl text-green-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Minhas Semanas</h3>
              <p class="text-sm text-gray-600">Visualize e envie timesheets</p>
            </div>
            
            <div onclick="renderReportsView()" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-chart-line text-4xl text-purple-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Meus Relatórios</h3>
              <p class="text-sm text-gray-600">Histórico e análises</p>
            </div>
          ` : ''}
          
          ${user.role === 'GESTOR' ? `
            <div onclick="renderTimesheetView()" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-plus-circle text-4xl text-blue-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Lançar Horas</h3>
              <p class="text-sm text-gray-600">Registre suas horas</p>
            </div>
            
            <div onclick="renderApprovalsView()" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-check-circle text-4xl text-green-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Aprovar Timesheets</h3>
              <p class="text-sm text-gray-600">Aprove horas dos colaboradores</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-chart-pie text-4xl text-purple-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Dashboard Gerencial</h3>
              <p class="text-sm text-gray-600">Análises da equipe (em breve)</p>
            </div>
          ` : ''}
          
          ${user.role === 'DIRETOR' ? `
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-building text-4xl text-blue-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Visão Executiva</h3>
              <p class="text-sm text-gray-600">Dashboard executivo completo</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-stamp text-4xl text-green-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Aprovar Mês</h3>
              <p class="text-sm text-gray-600">Aprovação mensal consolidada</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-cog text-4xl text-gray-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Administração</h3>
              <p class="text-sm text-gray-600">Gestão de usuários e projetos</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-file-alt text-4xl text-purple-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Relatórios</h3>
              <p class="text-sm text-gray-600">Relatórios consolidados</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
              <i class="fas fa-history text-4xl text-orange-600 mb-3"></i>
              <h3 class="text-lg font-bold text-gray-800 mb-2">Auditoria</h3>
              <p class="text-sm text-gray-600">Logs e histórico</p>
            </div>
          ` : ''}
        </div>
        
        <!-- Info Footer -->
        <div class="mt-8 text-center text-gray-600">
          <p class="text-sm">
            <i class="fas fa-info-circle mr-1"></i>
            Sistema de Timesheet v1.0 - MVP Completo
          </p>
          <p class="text-xs mt-1">
            Desenvolvido com Hono + Cloudflare Pages + D1
          </p>
        </div>
      </main>
    </div>
  `;
}

function setupDashboardHandlers() {
  // Handlers serão adicionados aqui para cada funcionalidade
}

async function loadDashboardData() {
  try {
    // Carregar stats reais do backend
    const response = await axios.get('/dashboard/stats');
    const stats = response.data.data;
    
    // Atualizar cards
    document.getElementById('weekHours').textContent = `${stats.total_hours_week.toFixed(2)}h`;
    document.getElementById('monthHours').textContent = `${stats.total_hours_month.toFixed(2)}h`;
    document.getElementById('pendingItems').textContent = stats.pending_approvals;
    
    const user = app.currentUser;
    if (user.role === 'COLABORADOR') {
      document.getElementById('pendingText').textContent = 'Semanas pendentes';
    } else {
      document.getElementById('pendingText').textContent = 'Timesheets para aprovar';
    }
    
    // Atualizar resumo de status
    const statusSummary = `
      <div class="text-center p-3 bg-gray-100 rounded">
        <p class="text-2xl font-bold text-gray-600">${stats.status_summary.rascunho || 0}</p>
        <p class="text-xs text-gray-600">Rascunho</p>
      </div>
      <div class="text-center p-3 bg-yellow-100 rounded">
        <p class="text-2xl font-bold text-yellow-600">${stats.status_summary.enviado || 0}</p>
        <p class="text-xs text-gray-600">Enviado</p>
      </div>
      <div class="text-center p-3 bg-green-100 rounded">
        <p class="text-2xl font-bold text-green-600">${stats.status_summary.aprovado_gestor || 0}</p>
        <p class="text-xs text-gray-600">Aprov. Gestor</p>
      </div>
      <div class="text-center p-3 bg-red-100 rounded">
        <p class="text-2xl font-bold text-red-600">${stats.status_summary.reprovado_gestor || 0}</p>
        <p class="text-xs text-gray-600">Reprovado</p>
      </div>
      <div class="text-center p-3 bg-blue-100 rounded">
        <p class="text-2xl font-bold text-blue-600">${stats.status_summary.aprovado_diretor || 0}</p>
        <p class="text-xs text-gray-600">Aprov. Diretor</p>
      </div>
      <div class="text-center p-3 bg-purple-100 rounded">
        <p class="text-2xl font-bold text-purple-600">${stats.status_summary.reprovado_diretor || 0}</p>
        <p class="text-xs text-gray-600">Repr. Diretor</p>
      </div>
    `;
    document.getElementById('statusSummary').innerHTML = statusSummary;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    // Manter valores padrão em caso de erro
    document.getElementById('weekHours').textContent = '0.00h';
    document.getElementById('monthHours').textContent = '0.00h';
    document.getElementById('pendingItems').textContent = '0';
  }
}

// ============================================
// RELATÓRIOS - INTERFACE COMPLETA
// ============================================

function renderReportsView() {
  const appDiv = document.getElementById('app');
  
  // Calcular datas padrão (último mês)
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  
  const defaultStart = lastMonth.toISOString().split('T')[0];
  const defaultEnd = lastMonthEnd.toISOString().split('T')[0];
  
  appDiv.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button onclick="render('dashboard')" class="text-gray-600 hover:text-gray-800">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                Meus Relatórios
              </h1>
              <p class="text-sm text-gray-600">Visualize e exporte seu histórico de horas</p>
            </div>
          </div>
          
          <button onclick="handleLogout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Sair
          </button>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fas fa-filter mr-2"></i>Filtros
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
              <input 
                type="date" 
                id="reportStartDate" 
                value="${defaultStart}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
              <input 
                type="date" 
                id="reportEndDate" 
                value="${defaultEnd}"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div class="flex items-end">
              <button 
                onclick="loadIndividualReport()" 
                class="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <i class="fas fa-search mr-2"></i>Buscar
              </button>
            </div>
          </div>
        </div>
        
        <!-- Resumo -->
        <div id="reportSummary" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 hidden">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total de Horas</p>
                <p class="text-3xl font-bold text-purple-600" id="reportTotalHours">0.00h</p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full">
                <i class="fas fa-clock text-2xl text-purple-600"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Total de Lançamentos</p>
                <p class="text-3xl font-bold text-blue-600" id="reportTotalEntries">0</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <i class="fas fa-list text-2xl text-blue-600"></i>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Média por Dia</p>
                <p class="text-3xl font-bold text-green-600" id="reportAvgPerDay">0.00h</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <i class="fas fa-chart-bar text-2xl text-green-600"></i>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Horas por Projeto -->
        <div id="reportByProject" class="bg-white rounded-lg shadow-md p-6 mb-6 hidden">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fas fa-project-diagram text-purple-600 mr-2"></i>
            Horas por Projeto
          </h3>
          <div id="projectBars"></div>
        </div>
        
        <!-- Tabela de Lançamentos -->
        <div id="reportTable" class="bg-white rounded-lg shadow-md p-6 hidden">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">
              <i class="fas fa-table text-purple-600 mr-2"></i>
              Detalhamento
            </h3>
            
            <button 
              onclick="exportReportCSV()" 
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <i class="fas fa-file-csv mr-2"></i>Exportar CSV
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projeto</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atividade</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody id="reportTableBody" class="bg-white divide-y divide-gray-200">
                <!-- Será preenchido via JS -->
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Estado vazio -->
        <div id="reportEmpty" class="bg-white rounded-lg shadow-md p-12 text-center">
          <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-bold text-gray-700 mb-2">Selecione um período</h3>
          <p class="text-gray-500">Use os filtros acima para visualizar seus relatórios</p>
        </div>
      </main>
    </div>
  `;
}

async function loadIndividualReport() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  
  if (!startDate || !endDate) {
    alert('Por favor, selecione as datas');
    return;
  }
  
  try {
    const response = await axios.get(`/reports/individual?start_date=${startDate}&end_date=${endDate}`);
    const data = response.data.data;
    
    // Ocultar estado vazio
    document.getElementById('reportEmpty').classList.add('hidden');
    
    // Mostrar resumo
    document.getElementById('reportSummary').classList.remove('hidden');
    document.getElementById('reportTotalHours').textContent = `${data.summary.total_hours.toFixed(2)}h`;
    document.getElementById('reportTotalEntries').textContent = data.summary.total_entries;
    
    // Calcular média por dia
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const avgPerDay = data.summary.total_hours / days;
    document.getElementById('reportAvgPerDay').textContent = `${avgPerDay.toFixed(2)}h`;
    
    // Mostrar horas por projeto
    if (Object.keys(data.summary.by_project).length > 0) {
      document.getElementById('reportByProject').classList.remove('hidden');
      renderProjectBars(data.summary.by_project);
    }
    
    // Mostrar tabela
    document.getElementById('reportTable').classList.remove('hidden');
    renderReportTable(data.entries);
    
  } catch (error) {
    alert('Erro ao carregar relatório: ' + (error.response?.data?.error || 'Erro desconhecido'));
    console.error(error);
  }
}

function renderProjectBars(byProject) {
  const container = document.getElementById('projectBars');
  const maxHours = Math.max(...Object.values(byProject));
  
  let html = '';
  for (const [project, hours] of Object.entries(byProject)) {
    const percentage = (hours / maxHours) * 100;
    html += `
      <div class="mb-4">
        <div class="flex justify-between mb-1">
          <span class="text-sm font-medium text-gray-700">${project}</span>
          <span class="text-sm font-bold text-purple-600">${hours.toFixed(2)}h</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div class="bg-purple-600 h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function renderReportTable(entries) {
  const tbody = document.getElementById('reportTableBody');
  
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Nenhum lançamento encontrado</td></tr>';
    return;
  }
  
  const statusColors = {
    'RASCUNHO': 'bg-gray-100 text-gray-800',
    'ENVIADO': 'bg-yellow-100 text-yellow-800',
    'APROVADO_GESTOR': 'bg-green-100 text-green-800',
    'REPROVADO_GESTOR': 'bg-red-100 text-red-800',
    'APROVADO_DIRETOR': 'bg-blue-100 text-blue-800'
  };
  
  const statusLabels = {
    'RASCUNHO': 'Rascunho',
    'ENVIADO': 'Enviado',
    'APROVADO_GESTOR': 'Aprovado Gestor',
    'REPROVADO_GESTOR': 'Reprovado',
    'APROVADO_DIRETOR': 'Aprovado Diretor'
  };
  
  let html = '';
  entries.forEach(entry => {
    const date = new Date(entry.entry_date).toLocaleDateString('pt-BR');
    const statusClass = statusColors[entry.status] || 'bg-gray-100 text-gray-800';
    const statusLabel = statusLabels[entry.status] || entry.status;
    
    html += `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
        <td class="px-6 py-4 text-sm text-gray-900">${entry.project_name}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${entry.activity_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">${entry.hours.toFixed(2)}h</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
            ${statusLabel}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${entry.description || '-'}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

async function exportReportCSV() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  
  if (!startDate || !endDate) {
    alert('Por favor, selecione as datas');
    return;
  }
  
  try {
    const response = await axios.get(`/reports/individual?start_date=${startDate}&end_date=${endDate}&format=csv`, {
      responseType: 'blob'
    });
    
    // Criar link de download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_individual_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    alert('Relatório exportado com sucesso!');
  } catch (error) {
    alert('Erro ao exportar relatório: ' + (error.response?.data?.error || 'Erro desconhecido'));
    console.error(error);
  }
}

// ============================================
// LOGOUT
// ============================================

function handleLogout() {
  if (confirm('Deseja realmente sair?')) {
    removeToken();
    render('login');
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  
  if (token) {
    try {
      const response = await axios.get('/auth/me');
      app.currentUser = response.data.data;
      render('dashboard');
    } catch (error) {
      removeToken();
      render('login');
    }
  } else {
    render('login');
  }
});
