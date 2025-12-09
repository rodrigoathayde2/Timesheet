// ============================================
// LANÇAMENTO DE HORAS - MÓDULO ADICIONAL
// ============================================

// Estado do timesheet
const timesheet = {
  projects: [],
  activities: [],
  entries: [],
  weekStart: null
};

// Renderizar tela de lançamento de horas
async function renderTimesheetView() {
  const appDiv = document.getElementById('app');
  
  // Carregar projetos
  try {
    const projRes = await axios.get('/projects');
    timesheet.projects = projRes.data.data.data || [];
  } catch (e) {
    console.error('Erro ao carregar projetos:', e);
  }
  
  // Calcular semana atual
  timesheet.weekStart = timesheet.weekStart ?? getMonday(new Date());
  
  appDiv.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${getHeaderHTML()}
      
      <main class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-clock mr-2"></i>Lançamento de Horas
            </h2>
            <button onclick="render('dashboard')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </button>
          </div>
          
          <!-- Seletor de Semana -->
          <div class="mb-6 flex items-center gap-4">
            <button onclick="changeWeek(-1)" class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-chevron-left"></i>
            </button>
            <div class="text-center flex-1">
              <p class="text-lg font-semibold">Semana: <span id="weekDisplay">${formatWeekRange(timesheet.weekStart)}</span></p>
              <p class="text-sm text-gray-600" id="weekStatus">Status: RASCUNHO</p>
            </div>
            <button onclick="changeWeek(1)" class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <!-- Formulário de Lançamento -->
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 class="font-semibold mb-3">Novo Lançamento</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select id="entryDate" class="px-3 py-2 border rounded-lg">
                ${getWeekDatesOptions(timesheet.weekStart)}
              </select>
              
              <select id="entryProject" onchange="loadActivities()" class="px-3 py-2 border rounded-lg">
                <option value="">Selecione Projeto</option>
                ${timesheet.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
              
              <select id="entryActivity" class="px-3 py-2 border rounded-lg">
                <option value="">Selecione Atividade</option>
              </select>
              
              <input type="number" id="entryHours" min="0.25" max="24" step="0.25" placeholder="Horas" class="px-3 py-2 border rounded-lg" />
              
              <button onclick="addEntry()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>Adicionar
              </button>
            </div>
            <input type="text" id="entryDescription" placeholder="Descrição (opcional)" class="mt-2 w-full px-3 py-2 border rounded-lg" />
          </div>
          
          <!-- Tabela de Lançamentos -->
          <div id="entriesTable">
            <p class="text-center text-gray-500 py-8">Carregando lançamentos...</p>
          </div>
          
          <!-- Ações -->
          <div class="mt-6 flex gap-3 justify-between">
            <div class="flex gap-2">
              <button onclick="copyPreviousWeek()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-copy mr-2"></i>Copiar Semana Anterior
              </button>
              <button onclick="showTemplates()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <i class="fas fa-save mr-2"></i>Templates
              </button>
              <button onclick="showReports()" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                <i class="fas fa-file-export mr-2"></i>Relatórios
              </button>
            </div>
            <button onclick="submitWeek()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              <i class="fas fa-paper-plane mr-2"></i>Enviar Semana para Aprovação
            </button>
          </div>
        </div>
      </main>
    </div>
  `;
  
  loadWeekEntries();
}

// Obter segunda-feira da semana
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

// Formatar range da semana
function formatWeekRange(monday) {
  const start = new Date(monday);
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
}

// Opções de datas da semana
function getWeekDatesOptions(monday) {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  let html = '';
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    html += `<option value="${dateStr}">${days[i]} - ${date.toLocaleDateString('pt-BR')}</option>`;
  }
  return html;
}

// Mudar semana
function changeWeek(offset) {
  const current = new Date(timesheet.weekStart);
  current.setDate(current.getDate() + (offset * 7));
  timesheet.weekStart = current.toISOString().split('T')[0];
  renderTimesheetView();
}

// Carregar atividades do projeto
async function loadActivities() {
  const projectId = document.getElementById('entryProject').value;
  const select = document.getElementById('entryActivity');
  
  if (!projectId) {
    select.innerHTML = '<option value="">Selecione Atividade</option>';
    return;
  }
  
  try {
    const res = await axios.get(`/activities?project_id=${projectId}`);
    const activities = res.data.data || [];
    select.innerHTML = '<option value="">Selecione Atividade</option>' +
      activities.map(a => `<option value="${a.id}">${a.name} (${a.type})</option>`).join('');
  } catch (e) {
    console.error('Erro ao carregar atividades:', e);
    alert('Erro ao carregar atividades');
  }
}

// Adicionar lançamento
async function addEntry() {
  const date = document.getElementById('entryDate').value;
  const projectId = document.getElementById('entryProject').value;
  const activityId = document.getElementById('entryActivity').value;
  const hours = parseFloat(document.getElementById('entryHours').value);
  const description = document.getElementById('entryDescription').value;
  
  if (!date || !projectId || !activityId || !hours) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }
  
  if (hours < 0.25 || hours > 24) {
    alert('Horas devem estar entre 0.25 e 24');
    return;
  }
  
  try {
    await axios.post('/timesheets', {
      entry_date: date,
      project_id: projectId,
      activity_id: activityId,
      hours,
      description
    });
    
    // Limpar form
    document.getElementById('entryHours').value = '';
    document.getElementById('entryDescription').value = '';
    
    // Recarregar
    loadWeekEntries();
    alert('Lançamento adicionado!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao adicionar lançamento');
  }
}

// Carregar lançamentos da semana
async function loadWeekEntries() {
  try {
    const res = await axios.get(`/timesheets/week/${getMonday(timesheet.weekStart)}`);
    const data = res.data.data;
    timesheet.entries = data.entries || [];
    
    const tableDiv = document.getElementById('entriesTable');
    
    if (timesheet.entries.length === 0) {
      tableDiv.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum lançamento nesta semana</p>';
      return;
    }
    
    // Atualizar status
    document.getElementById('weekStatus').textContent = `Status: ${data.status || 'RASCUNHO'}`;
    
    // Renderizar tabela
    let html = `
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">Data</th>
            <th class="px-4 py-2 text-left">Projeto</th>
            <th class="px-4 py-2 text-left">Atividade</th>
            <th class="px-4 py-2 text-right">Horas</th>
            <th class="px-4 py-2 text-left">Descrição</th>
            <th class="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    timesheet.entries.forEach(e => {
      const date = new Date(e.entry_date).toLocaleDateString('pt-BR');
      const canEdit = e.status === 'RASCUNHO';
      
      html += `
        <tr class="border-t">
          <td class="px-4 py-2">${date}</td>
          <td class="px-4 py-2">${e.project_name || '-'}</td>
          <td class="px-4 py-2">${e.activity_name || '-'}</td>
          <td class="px-4 py-2 text-right font-semibold">${e.hours}h</td>
          <td class="px-4 py-2 text-sm text-gray-600">${e.description || '-'}</td>
          <td class="px-4 py-2 text-center">
            ${canEdit ? `<button onclick="deleteEntry('${e.id}')" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>` : '<span class="text-green-600"><i class="fas fa-lock"></i></span>'}
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
        <tfoot class="bg-gray-100 font-bold">
          <tr>
            <td colspan="3" class="px-4 py-2 text-right">Total:</td>
            <td class="px-4 py-2 text-right">${data.total_hours || 0}h</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
    
    tableDiv.innerHTML = html;
  } catch (e) {
    console.error('Erro ao carregar lançamentos:', e);
    document.getElementById('entriesTable').innerHTML = '<p class="text-center text-red-500 py-8">Erro ao carregar lançamentos</p>';
  }
}

// Deletar lançamento
async function deleteEntry(id) {
  if (!confirm('Deseja realmente excluir este lançamento?')) return;
  
  try {
    await axios.delete(`/timesheets/${id}`);
    loadWeekEntries();
    alert('Lançamento excluído!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao excluir lançamento');
  }
}

// Enviar semana
async function submitWeek() {
  if (!confirm('Após enviar, você não poderá mais editar esta semana. Confirma?')) return;
  
  try {
    await axios.post('/timesheets/submit', {
      week_start_date: getMonday(timesheet.weekStart)
    });
    alert('Semana enviada para aprovação!');
    renderTimesheetView();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao enviar semana');
  }
}

// Renderizar tela de aprovações (Gestor)
async function renderApprovalsView() {
  const appDiv = document.getElementById('app');
  
  appDiv.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${getHeaderHTML()}
      
      <main class="max-w-7xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-check-circle mr-2"></i>Aprovar Timesheets
            </h2>
            <button onclick="render('dashboard')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <i class="fas fa-arrow-left mr-2"></i>Voltar
            </button>
          </div>
          
          <div id="pendingList">
            <p class="text-center py-8">Carregando pendências...</p>
          </div>
        </div>
      </main>
    </div>
  `;
  
  loadPendingApprovals();
}

// Carregar pendências
async function loadPendingApprovals() {
  try {
    const res = await axios.get('/timesheets/pending-approvals');
    const pending = res.data.data || [];
    
    const listDiv = document.getElementById('pendingList');
    
    if (pending.length === 0) {
      listDiv.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma pendência no momento</p>';
      return;
    }
    
    let html = '<div class="space-y-4">';
    
    pending.forEach(p => {
      const submitted = new Date(p.submitted_at).toLocaleString('pt-BR');
      
      html += `
        <div class="border rounded-lg p-4 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold text-lg">${p.full_name}</h3>
              <p class="text-sm text-gray-600">${p.email}</p>
              <p class="text-sm mt-1">
                <i class="fas fa-calendar mr-1"></i>Semana: ${formatWeekRange(p.week_start_date)}
              </p>
              <p class="text-sm">
                <i class="fas fa-clock mr-1"></i>${p.total_hours}h | ${p.entries_count} lançamentos
              </p>
              <p class="text-xs text-gray-500 mt-1">Enviado em: ${submitted}</p>
            </div>
            
            <div class="flex gap-2">
              <button onclick="approveWeek('${p.user_id}', '${p.week_start_date}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-check mr-1"></i>Aprovar
              </button>
              <button onclick="rejectWeek('${p.user_id}', '${p.week_start_date}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <i class="fas fa-times mr-1"></i>Reprovar
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    listDiv.innerHTML = html;
  } catch (e) {
    console.error('Erro ao carregar pendências:', e);
    document.getElementById('pendingList').innerHTML = '<p class="text-center text-red-500 py-8">Erro ao carregar pendências</p>';
  }
}

// Aprovar semana
async function approveWeek(userId, weekStart) {
  if (!confirm('Aprovar esta semana?')) return;
  
  try {
    await axios.post('/timesheets/approve', {
      user_id: userId,
      week_start_date: weekStart
    });
    alert('Semana aprovada!');
    loadPendingApprovals();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao aprovar');
  }
}

// Reprovar semana
async function rejectWeek(userId, weekStart) {
  const reason = prompt('Motivo da reprovação (mínimo 10 caracteres):');
  if (!reason || reason.length < 10) {
    alert('Justificativa inválida');
    return;
  }
  
  try {
    await axios.post('/timesheets/reject', {
      user_id: userId,
      week_start_date: weekStart,
      reason
    });
    alert('Semana reprovada!');
    loadPendingApprovals();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao reprovar');
  }
}

// Header compartilhado
function getHeaderHTML() {
  const user = app.currentUser;
  const roleText = {'COLABORADOR': 'Colaborador', 'GESTOR': 'Gestor', 'DIRETOR': 'Diretor'};
  
  return `
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
  `;
}

// Copiar semana anterior
async function copyPreviousWeek() {
  if (!confirm('Copiar lançamentos da semana anterior?')) return;
  
  const currentWeek = new Date(timesheet.weekStart);
  currentWeek.setDate(currentWeek.getDate() - 7);
  const previousWeek = currentWeek.toISOString().split('T')[0];
  
  try {
    await axios.post('/templates/copy-week', {
      source_week: previousWeek,
      target_week: timesheet.weekStart
    });
    alert('Semana copiada com sucesso!');
    loadWeekEntries();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao copiar semana');
  }
}

// Mostrar templates
async function showTemplates() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">Templates de Semana</h3>
      <div id="templatesList">Carregando...</div>
      <div class="mt-4 border-t pt-4">
        <h4 class="font-semibold mb-2">Salvar Semana Atual como Template</h4>
        <div class="flex gap-2">
          <input type="text" id="templateName" placeholder="Nome do template" class="flex-1 px-3 py-2 border rounded" />
          <button onclick="saveTemplate()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Salvar</button>
        </div>
      </div>
      <button onclick="closeModal()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  loadTemplatesList();
}

async function loadTemplatesList() {
  try {
    const res = await axios.get('/templates');
    const templates = res.data.data || [];
    
    const listDiv = document.getElementById('templatesList');
    if (templates.length === 0) {
      listDiv.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum template salvo</p>';
      return;
    }
    
    let html = '<div class="space-y-2">';
    templates.forEach(t => {
      const data = JSON.parse(t.template_data);
      html += `
        <div class="border p-3 rounded flex justify-between items-center">
          <div>
            <p class="font-semibold">${t.name} ${t.is_default ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Padrão</span>' : ''}</p>
            <p class="text-sm text-gray-600">${data.length} lançamentos</p>
          </div>
          <div class="flex gap-2">
            <button onclick="applyTemplate('${t.id}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Aplicar</button>
            <button onclick="deleteTemplate('${t.id}')" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Excluir</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    listDiv.innerHTML = html;
  } catch (e) {
    document.getElementById('templatesList').innerHTML = '<p class="text-red-500">Erro ao carregar templates</p>';
  }
}

async function saveTemplate() {
  const name = document.getElementById('templateName').value;
  if (!name) {
    alert('Digite um nome para o template');
    return;
  }
  
  try {
    await axios.post('/templates', {
      name,
      week_start_date: timesheet.weekStart,
      set_as_default: false
    });
    alert('Template salvo!');
    document.getElementById('templateName').value = '';
    loadTemplatesList();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao salvar template');
  }
}

async function applyTemplate(templateId) {
  if (!confirm('Aplicar este template na semana atual? Isto irá substituir os lançamentos existentes.')) return;
  
  try {
    await axios.post(`/templates/${templateId}/apply`, {
      week_start_date: timesheet.weekStart
    });
    alert('Template aplicado!');
    closeModal();
    loadWeekEntries();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao aplicar template');
  }
}

async function deleteTemplate(templateId) {
  if (!confirm('Excluir este template?')) return;
  
  try {
    await axios.delete(`/templates/${templateId}`);
    loadTemplatesList();
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao excluir template');
  }
}

function closeModal() {
  const modal = document.querySelector('.fixed.inset-0');
  if (modal) modal.remove();
}

// Mostrar relatórios
async function showReports() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
      <h3 class="text-xl font-bold mb-4">Relatórios</h3>
      
      <div class="space-y-4">
        <div class="border p-4 rounded">
          <h4 class="font-semibold mb-2">Relatório Individual</h4>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <input type="date" id="reportStartDate" class="px-3 py-2 border rounded" />
            <input type="date" id="reportEndDate" class="px-3 py-2 border rounded" />
          </div>
          <div class="flex gap-2">
            <button onclick="generateReport('json')" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ver Online</button>
            <button onclick="generateReport('csv')" class="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Baixar CSV</button>
          </div>
        </div>
      </div>
      
      <button onclick="closeModal()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  
  // Preencher datas padrão (mês atual)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
  document.getElementById('reportEndDate').value = lastDay.toISOString().split('T')[0];
}

async function generateReport(format) {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;
  
  if (!startDate || !endDate) {
    alert('Selecione as datas');
    return;
  }
  
  try {
    if (format === 'csv') {
      window.open(`/api/reports/individual?start_date=${startDate}&end_date=${endDate}&format=csv`, '_blank');
    } else {
      const res = await axios.get(`/reports/individual?start_date=${startDate}&end_date=${endDate}`);
      const data = res.data.data;
      
      // Mostrar relatório
      showReportResults(data);
    }
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao gerar relatório');
  }
}

function showReportResults(data) {
  closeModal();
  
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">Relatório Individual - ${data.period.start_date} a ${data.period.end_date}</h3>
      
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-100 p-4 rounded">
          <p class="text-sm text-gray-600">Total de Horas</p>
          <p class="text-2xl font-bold text-blue-600">${data.summary.total_hours}h</p>
        </div>
        <div class="bg-green-100 p-4 rounded">
          <p class="text-sm text-gray-600">Total de Lançamentos</p>
          <p class="text-2xl font-bold text-green-600">${data.summary.total_entries}</p>
        </div>
        <div class="bg-purple-100 p-4 rounded">
          <p class="text-sm text-gray-600">Projetos</p>
          <p class="text-2xl font-bold text-purple-600">${Object.keys(data.summary.by_project).length}</p>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-3 py-2 text-left">Data</th>
              <th class="px-3 py-2 text-left">Projeto</th>
              <th class="px-3 py-2 text-left">Atividade</th>
              <th class="px-3 py-2 text-right">Horas</th>
              <th class="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.entries.map(e => `
              <tr class="border-t">
                <td class="px-3 py-2">${new Date(e.entry_date).toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2">${e.project_name}</td>
                <td class="px-3 py-2">${e.activity_name}</td>
                <td class="px-3 py-2 text-right font-semibold">${e.hours}h</td>
                <td class="px-3 py-2"><span class="text-xs px-2 py-1 rounded bg-gray-100">${e.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <button onclick="closeModal()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}
