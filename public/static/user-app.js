const user = {
  departments: [],
  managers: [],
  entries: [],
};

async function renderUserView() {
  const appDiv = document.getElementById('app');
  
  try {
    const departments = await axios.get('/departments');
    user.departments = departments.data.data || [];
    
    const managers = await axios.get('/users/managers');
    user.managers = managers.data.data || [];
    
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
              <i class="fas fa-user mr-2"></i>Usuários
            </h2>
            <button onclick="showModal()" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              <i class="fas fa-add mr-2"></i>Adicionar
            </button>
          </div>
          
          <div id="entriesTable">
            <p class="text-center text-gray-500 py-8">Carregando usuários...</p>
          </div>
        </div>
      </main>
    </div>
  `;

  loadUsersEntries();
}

async function addEntry() {
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const cpf = document.getElementById('cpf').value;
  const matricula = document.getElementById('matricula').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const department = document.getElementById('department').value;
  const manager = document.getElementById('manager').value;
  const admissionDate = document.getElementById('admissionDate').value;
  const weeklyHours = parseFloat(document.getElementById('weeklyHours').value);
  
  if (!fullName || !email || !cpf || !matricula || !password || !role || !department || !manager || !admissionDate || !weeklyHours) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }
  
  if (weeklyHours <= 0) {
    alert('Horas semanais devem ser maior que 0');
    return;
  }
  
  try {
    await axios.post('/users', {
      full_name: fullName,
      email,
      cpf,
      matricula,
      password,
      role,
      department_id: department,
      manager_id: manager,
      weekly_hours: weeklyHours,
      admission_date: admissionDate,
    });
    
    closeModal();
    
    loadUsersEntries();
    alert('Usuário adicionado!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao adicionar usuário');
  }
}

async function updateEntry(id) {
  const fullName = document.getElementById('fullName').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const department = document.getElementById('department').value;
  const manager = document.getElementById('manager').value;
  const weeklyHours = parseFloat(document.getElementById('weeklyHours').value);
  const terminationDate = document.getElementById('termination_date').value;
  
  if (!fullName || !role || !department || !manager || !weeklyHours) {
    alert('Preencha todos os campos obrigatórios');
    return;
  }
  
  if (weeklyHours <= 0) {
    alert('Horas semanais devem ser maior que 0');
    return;
  }
  
  try {
    await axios.put(`/users/${id}`, {
      full_name: fullName,
      password,
      role,
      department_id: department,
      manager_id: manager,
      weekly_hours: weeklyHours,
      termination_date: terminationDate,
    });
    
    closeModal();
    
    loadUsersEntries();
    alert('Usuário atualizado!');
  } catch (e) {
    alert(e.response?.data?.error || 'Erro ao atualizar usuário');
  }
}

async function loadUsersEntries() {
  try {
    const res = await axios.get(`/users?limit=1000`);
    const data = res.data.data;
    user.entries = data.data || [];
    
    const tableDiv = document.getElementById('entriesTable');
    
    if (user.entries.length === 0) {
      tableDiv.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum usuário cadastrado</p>';
      return;
    }
    
    // Renderizar tabela
    let html = `
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">Nome</th>
            <th class="px-4 py-2 text-left">Cargo</th>
            <th class="px-4 py-2 text-left">Departamento</th>
            <th class="px-4 py-2 text-left">Superior</th>
            <th class="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    user.entries.forEach(e => {
      html += `
        <tr class="border-t">
          <td class="px-4 py-2">${e.full_name}</td>
          <td class="px-4 py-2">${e.role}</td>
          <td class="px-4 py-2">${e.department_name}</td>
          <td class="px-4 py-2">${e.manager_name || '-'}</td>
          <td class="px-4 py-2 text-center">
            <button onclick="showUpdateEntry('${e.id}', '${e.full_name}', '${e.role}', '${e.department_id}', '${e.manager_id}', '${e.weekly_hours}')" class="text-red-600 hover:text-red-800"><i class="fas fa-edit"></i></button>
          </td>
        </tr>
      `;
    });
        
    tableDiv.innerHTML = html;
  } catch (e) {
    console.error('Erro ao carregar usuários:', e);
    document.getElementById('entriesTable').innerHTML = '<p class="text-center text-red-500 py-8">Erro ao carregar usuários</p>';
  }
}

async function showUpdateEntry(id, fullName, role, department, manager, weekHours) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <h3 class="font-semibold mb-3">Usuário</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
          <input type="text" id="fullName" placeholder="Nome" value="${fullName}" class="px-3 py-2 border rounded-lg" />

          <input type="password" id="password" placeholder="Senha" class="px-3 py-2 border rounded-lg" />

          <select id="role" class="px-3 py-2 border rounded-lg">
            <option value="">Selecione Cargo</option>
            <option value="COLABORADOR">Colaborador</option>
            <option value="GESTOR">Gestor</option>
            <option value="DIRETOR">Diretor</option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
          <select id="department" class="px-3 py-2 border rounded-lg">
            <option value="">Selecione o Departamento</option>
              ${user.departments.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          
          <select id="manager" class="px-3 py-2 border rounded-lg">
            <option value="">Selecione o Superior</option>
              ${user.managers.map(p => `<option value="${p.id}">${p.full_name}</option>`).join('')}
          </select>

          <input type="number" id="weeklyHours" placeholder="Horas Semanais" value="${weekHours}" class="px-3 py-2 border rounded-lg" />

        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data Desligamento</label>
            <input 
              type="date" 
              id="termination_date" 
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
  document.getElementById('role').value = role;
  document.getElementById('department').value = department;
  document.getElementById('manager').value = manager;
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
      <h3 class="font-semibold mb-3">Usuário</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
        <input type="text" id="fullName" placeholder="Nome" class="px-3 py-2 border rounded-lg" />

        <input type="email" id="email" placeholder="Email" class="px-3 py-2 border rounded-lg" />

        <input type="text" id="cpf" placeholder="CPF" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
        <input type="text" id="matricula" placeholder="Matrícula" class="px-3 py-2 border rounded-lg" />

        <input type="password" id="password" placeholder="Senha" class="px-3 py-2 border rounded-lg" />

        <select id="role" class="px-3 py-2 border rounded-lg">
          <option value="">Selecione Cargo</option>
          <option value="COLABORADOR">Colaborador</option>
          <option value="GESTOR">Gestor</option>
          <option value="DIRETOR">Diretor</option>
        </select>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
        <select id="department" class="px-3 py-2 border rounded-lg">
          <option value="">Selecione o Departamento</option>
            ${user.departments.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        
        <select id="manager" class="px-3 py-2 border rounded-lg">
          <option value="">Selecione o Superior</option>
            ${user.managers.map(p => `<option value="${p.id}">${p.full_name}</option>`).join('')}
        </select>

        <input type="number" id="weeklyHours" placeholder="Horas Semanais" class="px-3 py-2 border rounded-lg" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-2 justify-between">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Data Admissão</label>
          <input 
            type="date" 
            id="admissionDate" 
            value="${defaultDate}"
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
