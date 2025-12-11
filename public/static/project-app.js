const project = {
  managers: [],
  entries: [],
};

async function renderProjectView() {
  const appDiv = document.getElementById('app');
  
  try {    
    const managers = await axios.get('/users?limit=1000');
    project.managers = managers.data.data.data || [];
    
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }
  
  appDiv.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      ${getHeaderHTML()}
      
      <main class="max-w-7xl mx-auto px-2 py-2">
        <div class="bg-white rounded-lg shadow-md p-2">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tasks mr-2"></i>Projetos
            </h2>
            <button onclick="showModal()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              <i class="fas fa-add mr-2"></i>Adicionar
            </button>
          </div>
          
          <div id="entriesTable">
            <p class="text-center text-gray-500 py-8">Carregando projetos...</p>
          </div>
        </div>
      </main>
    </div>
  `;

  loadProjectsEntries();
}

async function addEntry() {
  const name = document.getElementById('name').value;
  const code = document.getElementById('code').value;
  const description = document.getElementById('description').value;
  const manager_id = document.getElementById('manager_id').value;
  const client = document.getElementById('client').value;
  const cost_center = document.getElementById('cost_center').value;
  const start_date = document.getElementById('start_date').value;
  const end_date = document.getElementById('end_date').value;
  const budget_hours = parseFloat(document.getElementById('budget_hours').value);
  const hourly_rate = parseFloat(document.getElementById('hourly_rate').value);
  
  if (!name || !code || !description || !manager_id || !client || !cost_center || !start_date || !budget_hours || !hourly_rate) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }
  
  if (budget_hours <= 0) {
    alert('Budget deve ser maior que 0');
    return;
  }
  
  if (hourly_rate <= 0) {
    alert('Taxa hora deve ser maior que 0');
    return;
  }
  
  try {
    await axios.post('/projects', {
      name,
      code,
      description,
      manager_id,
      client,
      cost_center,
      start_date,
      end_date,
      budget_hours,
      hourly_rate,
    });
    
    closeModal();
    
    loadProjectsEntries();
    alert('Projeto adicionado!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao adicionar projeto');
  }
}

async function updateEntry(id) {
  const description = document.getElementById('description').value;
  const manager_id = document.getElementById('manager_id').value;
  const client = document.getElementById('client').value;
  const cost_center = document.getElementById('cost_center').value;
  const start_date = document.getElementById('start_date').value;
  const end_date = document.getElementById('end_date').value;
  const budget_hours = parseFloat(document.getElementById('budget_hours').value);
  const hourly_rate = parseFloat(document.getElementById('hourly_rate').value);
  
  if (!description || !manager_id || !client || !cost_center || !start_date || !budget_hours || !hourly_rate) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }
  
  if (budget_hours <= 0) {
    alert('Budget deve ser maior que 0');
    return;
  }
  
  if (hourly_rate <= 0) {
    alert('Taxa hora deve ser maior que 0');
    return;
  }
  
  try {
    await axios.put(`/projects/${id}`, {
      description,
      manager_id,
      client,
      cost_center,
      start_date,
      end_date,
      budget_hours,
      hourly_rate,
    });
    
    closeModal();
    
    loadProjectsEntries();
    alert('Projeto atualizado!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao atualizar projeto');
  }
}

async function loadProjectsEntries() {
  try {
    const res = await axios.get(`/projects?limit=1000`);
    const data = res.data.data;
    project.entries = data.data || [];
    
    const tableDiv = document.getElementById('entriesTable');
    
    if (project.entries.length === 0) {
      tableDiv.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum projeto cadastrado</p>';
      return;
    }
    
    // Renderizar tabela
    let html = `
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">Nome</th>
            <th class="px-4 py-2 text-left">Gerente</th>
            <th class="px-4 py-2 text-left">Cliente</th>
            <th class="px-4 py-2 text-left">Data Inicial</th>
            <th class="px-4 py-2 text-left">Data Final</th>
            <th class="px-4 py-2 text-left">Budget</th>
            <th class="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    project.entries.forEach(e => {
      html += `
        <tr class="border-t">
          <td class="px-4 py-2">${e.name}</td>
          <td class="px-4 py-2">${e.manager_name}</td>
          <td class="px-4 py-2">${e.client}</td>
          <td class="px-4 py-2">${e.start_date}</td>
          <td class="px-4 py-2">${e.end_date || ''}</td>
          <td class="px-4 py-2">${e.budget_hours}</td>
          <td class="px-4 py-2 text-center">
            <button onclick="showUpdateEntry('${e.id}', '${e.name}', '${e.code}', '${e.client}', '${e.cost_center}', '${e.budget_hours}', '${e.hourly_rate}', '${e.manager_id}', '${e.description}', '${e.start_date}', '${e.end_date}')" class="text-red-600 hover:text-red-800"><i class="fas fa-edit"></i></button>
          </td>
        </tr>
      `;
    });
        
    tableDiv.innerHTML = html;
  } catch (e) {
    console.error('Erro ao carregar projetos:', e);
    document.getElementById('entriesTable').innerHTML = '<p class="text-center text-red-500 py-8">Erro ao carregar projetos</p>';
  }
}

async function showUpdateEntry(id, name, code, client, cost_center, budget_hours, hourly_rate, manager_id, description, start_date, end_date) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="font-semibold mb-3">Projeto ${name} - ${code}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <input type="text" id="client" placeholder="Cliente" value="${client}" class="px-3 py-2 border rounded-lg" />

        <input type="text" id="cost_center" placeholder="Centro de Custo" value="${cost_center}" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
        <input type="number" id="budget_hours" placeholder="Budget" value="${budget_hours}" class="px-3 py-2 border rounded-lg" />

        <input type="number" id="hourly_rate" placeholder="Taxa Hora" value="${hourly_rate}" class="px-3 py-2 border rounded-lg" />

        <select id="manager_id" class="px-3 py-2 border rounded-lg">
          <option value="">Selecione o Gerente</option>
            ${project.managers.map(p => `<option value="${p.id}">${p.full_name}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-1 gap-3 py-2">
        <input type="text" id="description" placeholder="Descrição" value="${description}" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 justify-between">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
          <input 
            type="date" 
            id="start_date" 
            value="${start_date}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
          <input 
            type="date" 
            id="end_date" 
            value="${end_date}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="flex justify-end">
        <button onclick="updateEntry('${id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <i class="fas fa-check mr-2"></i>Atualizar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  document.getElementById('manager_id').value = manager_id;
}

function getHeaderHTML() {
  const user = app.currentUser;
  const roleText = {'COLABORADOR': 'Colaborador', 'GESTOR': 'Gestor', 'DIRETOR': 'Diretor'};
  
  return `
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <button onclick="render('dashboard')" class="text-gray-600 hover:text-gray-800">
            <i class="fas fa-arrow-left text-xl"></i>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-clock text-3xl text-blue-600"></i>
              Sistema de Timesheet
            </h1>
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

async function showModal() {
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="font-semibold mb-3">Projeto</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <input type="text" id="name" placeholder="Nome" class="px-3 py-2 border rounded-lg" />

        <input type="text" id="code" placeholder="Código" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
        <input type="text" id="client" placeholder="Cliente" class="px-3 py-2 border rounded-lg" />

        <input type="text" id="cost_center" placeholder="Centro de Custo" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
        <input type="number" id="budget_hours" placeholder="Budget" class="px-3 py-2 border rounded-lg" />

        <input type="number" id="hourly_rate" placeholder="Taxa Hora" class="px-3 py-2 border rounded-lg" />

        <select id="manager_id" class="px-3 py-2 border rounded-lg">
          <option value="">Selecione o Gerente</option>
            ${project.managers.map(p => `<option value="${p.id}">${p.full_name}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-1 gap-3 py-2">
        <input type="text" id="description" placeholder="Descrição" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 justify-between">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
          <input 
            type="date" 
            id="start_date" 
            value="${defaultDate}"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
          <input 
            type="date" 
            id="end_date" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="flex justify-end">
        <button onclick="addEntry()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Adicionar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}
