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
  timesheet.weekStart = getMonday(new Date());
  
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
          <div class="mt-6 flex gap-3 justify-end">
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
