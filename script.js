


// Função para alternar abas
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remover classe ativa de todas as abas
        tabs.forEach(t => t.classList.remove('active'));
        // Adicionar classe ativa à aba clicada
        tab.classList.add('active');

        // Esconder todos os conteúdos
        tabContents.forEach(content => content.classList.remove('active'));
        // Mostrar o conteúdo correspondente
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
});

// Função para obter dados do localStorage
function getData(key) {
    let data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// Função para salvar dados no localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Renderizar clientes na tabela "Clientes Cadastrados"
function renderClients() {
    const clients = getData('clients');
    const tbody = document.querySelector('#clientsTable tbody');
    tbody.innerHTML = '';

    clients.forEach((client, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td data-label="Nome">${client.name}</td>
            <td data-label="WhatsApp">${client.whatsapp}</td>
            <td data-label="Instagram">${client.instagram}</td>
            <td data-label="Data de Cadastro">${client.registrationDate}</td>
            <td data-label="Última Mensagem">${client.lastMessageDate}</td>
            <td data-label="Status">${client.status}</td>
            <td class="actions" data-label="Ações">
                <button onclick="editClient(${index})">Editar</button>
                <button class="delete" onclick="deleteClient(${index})">Excluir</button>
                <button onclick="updateLastMessage(${index})" class="update">Atualizar Data</button>
                ${client.status === 'Cliente Agendado' ? `<button onclick="addToAtendimento(${index})">Adicionar à Lista de Atendimento</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Editar cliente
let editingIndex = null;

function editClient(index) {
    const clients = getData('clients');
    const client = clients[index];
    document.getElementById('name').value = client.name;
    document.getElementById('whatsapp').value = client.whatsapp;
    document.getElementById('instagram').value = client.instagram;
    document.getElementById('registrationDate').value = client.registrationDate;
    document.getElementById('lastMessageDate').value = client.lastMessageDate;
    document.getElementById('status').value = client.status;
    if (client.status === 'Cliente Agendado') {
        document.getElementById('agendamentoFields').style.display = 'block';
        document.getElementById('appointmentDate').value = client.appointmentDate;
        document.getElementById('appointmentTime').value = client.appointmentTime;
        document.getElementById('tattooValue').value = client.tattooValue.toFixed(2);
    } else {
        document.getElementById('agendamentoFields').style.display = 'none';
    }
    editingIndex = index;
    document.querySelector('#clientForm button').textContent = 'Atualizar';
    // Mudar para aba de cadastro ao editar
    document.querySelector('.tab[data-tab="cadastro"]').click();
}

// Deletar cliente
function deleteClient(index) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        const clients = getData('clients');
        clients.splice(index, 1);
        saveData('clients', clients);
        renderClients();
        // Também remover do atendimento, se estiver presente
        const atendimento = getData('atendimento');
        const atendimentoIndex = atendimento.findIndex(item => item.clientIndex === index);
        if (atendimentoIndex !== -1) {
            atendimento.splice(atendimentoIndex, 1);
            saveData('atendimento', atendimento);
            renderAtendimento();
        }
    }
}

// Atualizar data da última mensagem
function updateLastMessage(index) {
    const clients = getData('clients');
    const today = new Date().toISOString().split('T')[0];
    clients[index].lastMessageDate = today;
    saveData('clients', clients);
    renderClients();
    alert('Data da última mensagem atualizada.');
}

// Adicionar cliente à lista de atendimento
function addToAtendimento(index) {
    const atendimento = getData('atendimento');

    // Verificar se o cliente já está na lista
    if (atendimento.some(item => item.clientIndex === index)) {
        alert('Este cliente já está na lista de atendimento.');
        return;
    }

    atendimento.push({ clientIndex: index, valorPago: 0 });
    saveData('atendimento', atendimento);
    renderAtendimento();
    alert('Cliente adicionado à lista de atendimento.');
}

// Renderizar clientes na tabela "Clientes a Serem Atendidos"
function renderAtendimento() {
    const atendimento = getData('atendimento');
    const clients = getData('clients');
    const tbody = document.querySelector('#atendimentoTable tbody');
    tbody.innerHTML = '';

    if (atendimento.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum cliente a ser atendido.</td></tr>';
        return;
    }

    atendimento.forEach((item, index) => {
        const client = clients[item.clientIndex];
        if (client) { // Verificar se o cliente existe
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td data-label="Nome">${client.name}</td>
                <td data-label="WhatsApp">${client.whatsapp}</td>
                <td data-label="Instagram">${client.instagram}</td>
                <td data-label="Data de Cadastro">${client.registrationDate}</td>
                <td data-label="Status">${client.status}</td>
                <td data-label="Data do Atendimento">${client.appointmentDate || 'N/A'}</td>
                <td data-label="Hora do Atendimento">${client.appointmentTime || 'N/A'}</td>
                <td data-label="Valor da Tatuagem">R$ ${client.tattooValue.toFixed(2)}</td>
                <td class="actions" data-label="Ações">
                    <button onclick="finalizarAtendimento(${index})">Finalizar Atendimento</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });
}

// Finalizar atendimento
function finalizarAtendimento(index) {
    const atendimento = getData('atendimento');
    const clients = getData('clients');
    const client = clients[atendimento[index].clientIndex];

    // Escolher template de mensagem
    const templates = getData('messageTemplates');
    if (templates.length === 0) {
        alert('Nenhum template de mensagem cadastrado. Por favor, cadastre um template antes de finalizar o atendimento.');
        return;
    }

    const templateNames = templates.map((t, i) => `${i}: ${t.name}`).join('\n');
    const templateChoice = prompt(`Escolha um template de mensagem para enviar:\n${templateNames}`);

    const templateIndex = parseInt(templateChoice);
    if (isNaN(templateIndex) || templateIndex < 0 || templateIndex >= templates.length) {
        alert('Escolha de template inválida.');
        return;
    }

    const selectedTemplate = templates[templateIndex];
    let personalizedMessage = selectedTemplate.message;

    // Substituir as tags nas mensagens
    selectedTemplate.tags.forEach(tag => {
        const tagKey = tag.replace(/[{}]/g, '');
        if (tagKey === 'nome') {
            personalizedMessage = personalizedMessage.replace(tag, client.name);
        } else if (tagKey === 'data') {
            personalizedMessage = personalizedMessage.replace(tag, client.appointmentDate || '');
        } else if (tagKey === 'hora') {
            personalizedMessage = personalizedMessage.replace(tag, client.appointmentTime || '');
        }
        // Adicione mais tags conforme necessário
    });

    // Enviar mensagem via WhatsApp
    const url = `https://wa.me/${client.whatsapp}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');

    // Atualizar status do cliente para "Cliente Pós Tattoo"
    clients[atendimento[index].clientIndex].status = 'Cliente Pós Tattoo';
    saveData('clients', clients);

    // Remover cliente da lista de atendimento
    atendimento.splice(index, 1);
    saveData('atendimento', atendimento);

    // Registrar no log
    const logs = getData('messageLogs');
    const now = new Date().toISOString().split('T')[0];
    logs.push({
        client: client.name,
        platform: 'WhatsApp',
        message: personalizedMessage,
        date: now
    });
    saveData('messageLogs', logs);
    renderLogs();

    // Re-renderizar as tabelas
    renderAtendimento();
    renderClients();

    alert('Atendimento finalizado e mensagem enviada.');
}

// Enviar mensagem de finalização via WhatsApp e atualizar status para "Cliente Ativo"
function enviarMensagemFinalizacao(client) {
    const templates = getData('messageTemplates');
    if (templates.length === 0) {
        alert('Nenhum template de mensagem cadastrado para enviar.');
        return;
    }

    // Selecionar o template adequado (por exemplo, o primeiro disponível)
    const template = templates.find(t => t.name.toLowerCase().includes('pós')) || templates[0];
    let personalizedMessage = template.message;

    // Substituir as tags nas mensagens
    template.tags.forEach(tag => {
        const tagKey = tag.replace(/[{}]/g, '');
        if (tagKey === 'nome') {
            personalizedMessage = personalizedMessage.replace(tag, client.name);
        } else if (tagKey === 'data') {
            personalizedMessage = personalizedMessage.replace(tag, client.appointmentDate || '');
        } else if (tagKey === 'hora') {
            personalizedMessage = personalizedMessage.replace(tag, client.appointmentTime || '');
        }
        // Adicione mais tags conforme necessário
    });

    const url = `https://wa.me/${client.whatsapp}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');

    // Registrar no log
    const logs = getData('messageLogs');
    const now = new Date().toISOString().split('T')[0];
    logs.push({
        client: client.name,
        platform: 'WhatsApp',
        message: personalizedMessage,
        date: now
    });
    saveData('messageLogs', logs);
    renderLogs();
}

// Renderizar clientes filtrados
function renderFilteredClients(filterStatus = '', filterTime = '') {
    const clients = getData('clients');
    const tbody = document.querySelector('#filteredClientsTable tbody');
    tbody.innerHTML = '';

    const now = new Date();
    let filteredClients = [];

    clients.forEach((client, index) => {
        // Filtros
        let statusMatch = filterStatus ? client.status === filterStatus : true;

        let timeMatch = true;
        if (filterTime) {
            const lastMsgDate = new Date(client.lastMessageDate);
            const diffTime = now - lastMsgDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (filterTime === '20') {
                timeMatch = diffDays <= 20;
            } else if (filterTime === '2+') {
                timeMatch = diffDays > 60;
            }
        }

        if (statusMatch && timeMatch) {
            filteredClients.push({ ...client, index });
        }
    });

    filteredClients.forEach(client => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td data-label=""><input type="checkbox" class="client-checkbox" data-index="${client.index}"></td>
            <td data-label="Nome">${client.name}</td>
            <td data-label="WhatsApp">${client.whatsapp}</td>
            <td data-label="Instagram">${client.instagram}</td>
            <td data-label="Data de Cadastro">${client.registrationDate}</td>
            <td data-label="Última Mensagem">${client.lastMessageDate}</td>
            <td data-label="Status">${client.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Aplicar filtros
document.getElementById('applyFilters').addEventListener('click', function() {
    const filterStatus = document.getElementById('filterStatus').value;
    const filterTime = document.getElementById('filterTime').value;
    renderFilteredClients(filterStatus, filterTime);
    // Mudar para aba de filtros após aplicar filtros
    document.querySelector('.tab[data-tab="filtros"]').click();
});

// Limpar filtros
document.getElementById('clearFilters').addEventListener('click', function() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterTime').value = '';
    renderFilteredClients();
    // Mudar para aba de filtros após limpar filtros
    document.querySelector('.tab[data-tab="filtros"]').click();
});

// Selecionar/Deselecionar todos os checkboxes
document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.client-checkbox');
    checkboxes.forEach(cb => cb.checked = this.checked);
});

// Enviar mensagens em massa
document.getElementById('sendBulkMessage').addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('.client-checkbox:checked');
    const selectedTemplateIndex = document.getElementById('selectedTemplate').value;

    if (checkboxes.length === 0) {
        alert('Por favor, selecione pelo menos um cliente.');
        return;
    }

    if (selectedTemplateIndex === '') {
        alert('Por favor, selecione um template de mensagem.');
        return;
    }

    const templates = getData('messageTemplates');
    const template = templates[selectedTemplateIndex];
    let message = template.message;

    const clients = getData('clients');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
    const now = new Date().toISOString().split('T')[0];
    const logs = getData('messageLogs');

    selectedIndices.forEach(index => {
        const client = clients[index];
        let personalizedMessage = message;

        template.tags.forEach(tag => {
            const tagKey = tag.replace(/[{}]/g, '');
            if (tagKey === 'nome') {
                personalizedMessage = personalizedMessage.replace(tag, client.name);
            } else if (tagKey === 'data') {
                personalizedMessage = personalizedMessage.replace(tag, client.appointmentDate || '');
            } else if (tagKey === 'hora') {
                personalizedMessage = personalizedMessage.replace(tag, client.appointmentTime || '');
            }
            // Adicione mais tags conforme necessário
        });

        const platform = prompt(`Enviar mensagem para ${client.name} via (1) WhatsApp ou (2) Instagram? Digite 1 ou 2:`);

        if (platform === '1') {
            const url = `https://wa.me/${client.whatsapp}?text=${encodeURIComponent(personalizedMessage)}`;
            window.open(url, '_blank');
            logs.push({
                client: client.name,
                platform: 'WhatsApp',
                message: personalizedMessage,
                date: now
            });
        } else if (platform === '2') {
            // Nota: O Instagram não suporta envio de mensagens via URL diretamente
            alert(`Por favor, envie a mensagem manualmente no Instagram para ${client.name}.`);
            window.open(`https://instagram.com/${client.instagram}`, '_blank');
            logs.push({
                client: client.name,
                platform: 'Instagram',
                message: personalizedMessage,
                date: now
            });
        } else {
            alert('Opção inválida para ' + client.name + '.');
        }

        // Atualizar a data da última mensagem
        clients[index].lastMessageDate = now;
    });

    saveData('clients', clients);
    saveData('messageLogs', logs);
    renderClients();
    renderFilteredClients(document.getElementById('filterStatus').value, document.getElementById('filterTime').value);
    renderLogs();
    alert('Mensagens enviadas e logs atualizados.');
});

// Cadastro de Templates de Mensagens
document.getElementById('messageTemplateForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const templateName = document.getElementById('templateName').value.trim();
    const templateTags = document.getElementById('templateTags').value.trim().split(',').map(tag => tag.trim());
    const templateMessage = document.getElementById('templateMessage').value.trim();

    if (templateName === '' || templateMessage === '') {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const templates = getData('messageTemplates');
    templates.push({ name: templateName, tags: templateTags, message: templateMessage });
    saveData('messageTemplates', templates);
    renderTemplates();
    document.getElementById('messageTemplateForm').reset();
});

// Renderizar Templates
function renderTemplates() {
    const templates = getData('messageTemplates');
    const templatesList = document.getElementById('templatesList');
    const selectedTemplate = document.getElementById('selectedTemplate');
    templatesList.innerHTML = '';
    selectedTemplate.innerHTML = '<option value="">Selecionar Template</option>';

    templates.forEach((template, index) => {
        // Lista de templates
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${template.name} (${template.tags.join(', ')})</span>
            <button onclick="deleteTemplate(${index})">Excluir</button>
        `;
        templatesList.appendChild(li);

        // Opções para seleção
        const option = document.createElement('option');
        option.value = index;
        option.textContent = template.name;
        selectedTemplate.appendChild(option);
    });
}

// Deletar Template
function deleteTemplate(index) {
    if (confirm('Tem certeza que deseja excluir este template?')) {
        const templates = getData('messageTemplates');
        templates.splice(index, 1);
        saveData('messageTemplates', templates);
        renderTemplates();
    }
}

// Renderizar Logs de Mensagens
function renderLogs() {
    const logs = getData('messageLogs');
    const tbody = document.querySelector('#logsTable tbody');
    tbody.innerHTML = '';

    logs.forEach((log, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td data-label="Cliente">${log.client}</td>
            <td data-label="Plataforma">${log.platform}</td>
            <td data-label="Mensagem">${log.message}</td>
            <td data-label="Data">${log.date}</td>
            <td class="actions" data-label="Ações">
                <button class="delete-log" onclick="deleteLog(${index})">Apagar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Deletar Log de Mensagem
function deleteLog(index) {
    if (confirm('Tem certeza que deseja apagar este log?')) {
        const logs = getData('messageLogs');
        logs.splice(index, 1);
        saveData('messageLogs', logs);
        renderLogs();
    }
}

// Renderizar Calendário
const calendarHeader = document.getElementById('calendarHeader');
const calendarBody = document.getElementById('calendarBody');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

let currentDate = new Date();

// Datas comemorativas para o estúdio de tatuagem
const commemorativeDates = {
    '01-05': 'Dia do Tatuador',
    '02-14': 'Dia dos Namorados',
    '03-08': 'Dia Internacional da Mulher',
    '04-21': 'Dia de Tiradentes',
    '05-12': 'Dia das Mães',
    '06-12': 'Dia dos Namorados (Brasil)',
    '07-20': 'Dia do Amigo',
    '08-11': 'Dia dos Pais',
    '09-07': 'Dia da Independência',
    '10-31': 'Halloween',
    '11-25': 'Black Friday',
    '12-25': 'Natal'
};

function generateCalendar() {
    // Limpar o calendário anterior
    calendarBody.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Atualizar o cabeçalho
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    calendarHeader.textContent = `${monthNames[month]} ${year}`;

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1).getDay();

    // Número de dias no mês
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let date = 1;
    for (let i = 0; i < 6; i++) { // 6 semanas para cobrir todos os meses
        const row = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                const cell = document.createElement('td');
                cell.innerHTML = '';
                row.appendChild(cell);
            } else if (date > daysInMonth) {
                const cell = document.createElement('td');
                cell.innerHTML = '';
                row.appendChild(cell);
            } else {
                const cell = document.createElement('td');

                // Número do dia
                const dateNumber = document.createElement('div');
                dateNumber.classList.add('date-number');
                dateNumber.textContent = date;
                cell.appendChild(dateNumber);

                // Verificar se há evento nesse dia
                const monthStr = (month + 1).toString().padStart(2, '0');
                const dayStr = date.toString().padStart(2, '0');
                const key = `${monthStr}-${dayStr}`;

                if (commemorativeDates[key]) {
                    const event = document.createElement('div');
                    event.classList.add('event');
                    event.textContent = '🎉';

                    // Tooltip com a descrição do evento
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.textContent = commemorativeDates[key];
                    event.appendChild(tooltip);

                    cell.appendChild(event);
                }

                // Verificar se há clientes agendados nesse dia
                const clients = getData('clients');
                clients.forEach((client, index) => {
                    if (client.status === 'Cliente Agendado' && client.appointmentDate === `${year}-${monthStr}-${dayStr}`) {
                        const clientDiv = document.createElement('div');
                        clientDiv.classList.add('event');
                        clientDiv.style.backgroundColor = '#4caf50';
                        clientDiv.style.width = '100%';
                        clientDiv.style.height = '20px';
                        clientDiv.style.marginTop = '5px';
                        clientDiv.style.cursor = 'pointer';
                        clientDiv.title = `Nome: ${client.name}\nValor: R$ ${client.tattooValue.toFixed(2)}\nHora: ${client.appointmentTime}`;
                        clientDiv.textContent = '🗓️';
                        cell.appendChild(clientDiv);
                    }
                });

                row.appendChild(cell);
                date++;
            }
        }

        calendarBody.appendChild(row);

        // Parar se todos os dias do mês já foram renderizados
        if (date > daysInMonth) {
            break;
        }
    }
}

// Função para mostrar popups 10 dias antes das datas comemorativas
function checkUpcomingEvents() {
    const today = new Date();
    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);

    const month = tenDaysLater.getMonth() + 1;
    const day = tenDaysLater.getDate();
    const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    if (commemorativeDates[key]) {
        alert(`Em 10 dias é ${commemorativeDates[key]}! Prepare suas promoções.`);
    }
}

// Navegação entre meses
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateAndCheckCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateAndCheckCalendar();
});

// Chamar a função após gerar o calendário
function generateAndCheckCalendar() {
    generateCalendar();
    checkUpcomingEvents();
}

// Cadastro de Clientes
document.getElementById('clientForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const registrationDate = document.getElementById('registrationDate').value;
    const lastMessageDate = document.getElementById('lastMessageDate').value;
    const status = document.getElementById('status').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const tattooValueInput = document.getElementById('tattooValue').value.trim();
    const tattooValue = parseFloat(tattooValueInput.replace(',', '.')) || 0;

    const clients = getData('clients');

    if (editingIndex !== null) {
        // Editando
        clients[editingIndex] = { 
            name, 
            whatsapp, 
            instagram, 
            registrationDate, 
            lastMessageDate, 
            status,
            appointmentDate: status === 'Cliente Agendado' ? appointmentDate : null,
            appointmentTime: status === 'Cliente Agendado' ? appointmentTime : null,
            tattooValue: status === 'Cliente Agendado' ? tattooValue : 0
        };
        saveData('clients', clients);
        editingIndex = null;
        e.target.querySelector('button').textContent = 'Cadastrar';
    } else {
        // Adicionando
        clients.push({ 
            name, 
            whatsapp, 
            instagram, 
            registrationDate, 
            lastMessageDate, 
            status,
            appointmentDate: status === 'Cliente Agendado' ? appointmentDate : null,
            appointmentTime: status === 'Cliente Agendado' ? appointmentTime : null,
            tattooValue: status === 'Cliente Agendado' ? tattooValue : 0
        });
        saveData('clients', clients);
    }

    e.target.reset();
    document.getElementById('agendamentoFields').style.display = 'none';
    renderClients();
    generateCalendar(); // Atualizar o calendário para mostrar novos agendamentos
    // Mudar para aba de clientes após cadastrar
    document.querySelector('.tab[data-tab="clientes"]').click();
});

// Mostrar ou esconder campos de agendamento com base no status
document.getElementById('status').addEventListener('change', function() {
    if (this.value === 'Cliente Agendado') {
        document.getElementById('agendamentoFields').style.display = 'block';
        document.getElementById('appointmentDate').required = true;
        document.getElementById('appointmentTime').required = true;
        document.getElementById('tattooValue').required = true;
    } else {
        document.getElementById('agendamentoFields').style.display = 'none';
        document.getElementById('appointmentDate').required = false;
        document.getElementById('appointmentTime').required = false;
        document.getElementById('tattooValue').required = false;
    }
});

// Monitorar eventos no carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    renderClients();
    renderLogs();
    renderTemplates();
    generateAndCheckCalendar();
    renderAtendimento();
});

// Relatórios
document.getElementById('relatorioTipo').addEventListener('change', function() {
    const tipo = this.value;
    document.getElementById('relatorioMes').style.display = tipo === 'mes' ? 'block' : 'none';
    document.getElementById('relatorioPeriodo').style.display = tipo === 'periodo' ? 'block' : 'none';
    document.getElementById('relatorioComparar').style.display = tipo === 'comparar' ? 'block' : 'none';
});

// Gerar Relatório
document.getElementById('gerarRelatorio').addEventListener('click', function() {
    const tipo = document.getElementById('relatorioTipo').value;
    const relatorioOutput = document.getElementById('relatorioOutput');
    relatorioOutput.innerHTML = '';

    const clients = getData('clients');
    const atendimento = getData('atendimento');
    const logs = getData('messageLogs');

    if (tipo === 'mes') {
        const selectedMonth = document.getElementById('relatorioSelecionarMes').value;
        if (!selectedMonth) {
            alert('Por favor, selecione um mês.');
            return;
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        const filteredAtendimentos = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate.getFullYear() === year && (logDate.getMonth() + 1) === month;
        });

        const totalAtendimentos = filteredAtendimentos.length;
        const totalValor = filteredAtendimentos.reduce((sum, log) => {
            // Encontrar o cliente e somar o valor da tatuagem
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Mês:</strong> ${monthNames(month - 1)} ${year}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor.toFixed(2)}</p>
        `;
    } else if (tipo === 'periodo') {
        const inicio = document.getElementById('relatorioInicio').value;
        const fim = document.getElementById('relatorioFim').value;

        if (!inicio || !fim) {
            alert('Por favor, selecione o período.');
            return;
        }

        const filteredAtendimentos = logs.filter(log => {
            return log.date >= inicio && log.date <= fim;
        });

        const totalAtendimentos = filteredAtendimentos.length;
        const totalValor = filteredAtendimentos.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Período:</strong> ${inicio} a ${fim}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor.toFixed(2)}</p>
        `;
    } else if (tipo === 'comparar') {
        const inicio1 = document.getElementById('relatorioCompararInicio1').value;
        const fim1 = document.getElementById('relatorioCompararFim1').value;
        const inicio2 = document.getElementById('relatorioCompararInicio2').value;
        const fim2 = document.getElementById('relatorioCompararFim2').value;

        if (!inicio1 || !fim1 || !inicio2 || !fim2) {
            alert('Por favor, selecione ambos os períodos.');
            return;
        }

        const filteredAtendimentos1 = logs.filter(log => {
            return log.date >= inicio1 && log.date <= fim1;
        });

        const filteredAtendimentos2 = logs.filter(log => {
            return log.date >= inicio2 && log.date <= fim2;
        });

        const totalAtendimentos1 = filteredAtendimentos1.length;
        const totalValor1 = filteredAtendimentos1.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        const totalAtendimentos2 = filteredAtendimentos2.length;
        const totalValor2 = filteredAtendimentos2.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Período 1:</strong> ${inicio1} a ${fim1}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos1}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor1.toFixed(2)}</p>
            <hr>
            <p><strong>Período 2:</strong> ${inicio2} a ${fim2}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos2}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor2.toFixed(2)}</p>
        `;
    }
});

// Relatório Tipo Change
document.getElementById('relatorioTipo').addEventListener('change', function() {
    const tipo = this.value;
    document.getElementById('relatorioMes').style.display = tipo === 'mes' ? 'block' : 'none';
    document.getElementById('relatorioPeriodo').style.display = tipo === 'periodo' ? 'block' : 'none';
    document.getElementById('relatorioComparar').style.display = tipo === 'comparar' ? 'block' : 'none';
});

// Array de nomes dos meses para relatórios
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Renderizar Calendário
function generateCalendar() {
    // Limpar o calendário anterior
    calendarBody.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Atualizar o cabeçalho
    const monthNamesArr = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    calendarHeader.textContent = `${monthNamesArr[month]} ${year}`;

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1).getDay();

    // Número de dias no mês
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let date = 1;
    for (let i = 0; i < 6; i++) { // 6 semanas para cobrir todos os meses
        const row = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                const cell = document.createElement('td');
                cell.innerHTML = '';
                row.appendChild(cell);
            } else if (date > daysInMonth) {
                const cell = document.createElement('td');
                cell.innerHTML = '';
                row.appendChild(cell);
            } else {
                const cell = document.createElement('td');

                // Número do dia
                const dateNumber = document.createElement('div');
                dateNumber.classList.add('date-number');
                dateNumber.textContent = date;
                cell.appendChild(dateNumber);

                // Verificar se há evento comemorativo nesse dia
                const monthStr = (month + 1).toString().padStart(2, '0');
                const dayStr = date.toString().padStart(2, '0');
                const key = `${monthStr}-${dayStr}`;

                if (commemorativeDates[key]) {
                    const event = document.createElement('div');
                    event.classList.add('event');
                    event.textContent = '🎉';

                    // Tooltip com a descrição do evento
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.textContent = commemorativeDates[key];
                    event.appendChild(tooltip);

                    cell.appendChild(event);
                }

                // Verificar se há clientes agendados nesse dia
                const clients = getData('clients');
                clients.forEach((client, index) => {
                    if (client.status === 'Cliente Agendado' && client.appointmentDate === `${year}-${monthStr}-${dayStr}`) {
                        const clientDiv = document.createElement('div');
                        clientDiv.classList.add('event');
                        clientDiv.style.backgroundColor = '#4caf50';
                        clientDiv.style.width = '100%';
                        clientDiv.style.height = '20px';
                        clientDiv.style.marginTop = '5px';
                        clientDiv.style.cursor = 'pointer';
                        clientDiv.title = `Nome: ${client.name}\nValor: R$ ${client.tattooValue.toFixed(2)}\nHora: ${client.appointmentTime}`;
                        clientDiv.textContent = '🗓️';
                        cell.appendChild(clientDiv);
                    }
                });

                row.appendChild(cell);
                date++;
            }
        }

        calendarBody.appendChild(row);

        // Parar se todos os dias do mês já foram renderizados
        if (date > daysInMonth) {
            break;
        }
    }
}

// Gerar Relatório
document.getElementById('gerarRelatorio').addEventListener('click', function() {
    const tipo = document.getElementById('relatorioTipo').value;
    const relatorioOutput = document.getElementById('relatorioOutput');
    relatorioOutput.innerHTML = '';

    const clients = getData('clients');
    const logs = getData('messageLogs');

    if (tipo === 'mes') {
        const selectedMonth = document.getElementById('relatorioSelecionarMes').value;
        if (!selectedMonth) {
            alert('Por favor, selecione um mês.');
            return;
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        const filteredAtendimentos = logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate.getFullYear() === year && (logDate.getMonth() + 1) === month;
        });

        const totalAtendimentos = filteredAtendimentos.length;
        const totalValor = filteredAtendimentos.reduce((sum, log) => {
            // Encontrar o cliente e somar o valor da tatuagem
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Mês:</strong> ${monthNames[month - 1]} ${year}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor.toFixed(2)}</p>
        `;
    } else if (tipo === 'periodo') {
        const inicio = document.getElementById('relatorioInicio').value;
        const fim = document.getElementById('relatorioFim').value;

        if (!inicio || !fim) {
            alert('Por favor, selecione o período.');
            return;
        }

        const filteredAtendimentos = logs.filter(log => {
            return log.date >= inicio && log.date <= fim;
        });

        const totalAtendimentos = filteredAtendimentos.length;
        const totalValor = filteredAtendimentos.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Período:</strong> ${inicio} a ${fim}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor.toFixed(2)}</p>
        `;
    } else if (tipo === 'comparar') {
        const inicio1 = document.getElementById('relatorioCompararInicio1').value;
        const fim1 = document.getElementById('relatorioCompararFim1').value;
        const inicio2 = document.getElementById('relatorioCompararInicio2').value;
        const fim2 = document.getElementById('relatorioCompararFim2').value;

        if (!inicio1 || !fim1 || !inicio2 || !fim2) {
            alert('Por favor, selecione ambos os períodos.');
            return;
        }

        const filteredAtendimentos1 = logs.filter(log => {
            return log.date >= inicio1 && log.date <= fim1;
        });

        const filteredAtendimentos2 = logs.filter(log => {
            return log.date >= inicio2 && log.date <= fim2;
        });

        const totalAtendimentos1 = filteredAtendimentos1.length;
        const totalValor1 = filteredAtendimentos1.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        const totalAtendimentos2 = filteredAtendimentos2.length;
        const totalValor2 = filteredAtendimentos2.reduce((sum, log) => {
            const client = clients.find(c => c.name === log.client);
            return client ? sum + client.tattooValue : sum;
        }, 0);

        relatorioOutput.innerHTML = `
            <p><strong>Período 1:</strong> ${inicio1} a ${fim1}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos1}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor1.toFixed(2)}</p>
            <hr>
            <p><strong>Período 2:</strong> ${inicio2} a ${fim2}</p>
            <p><strong>Total de Atendimentos:</strong> ${totalAtendimentos2}</p>
            <p><strong>Faturamento:</strong> R$ ${totalValor2.toFixed(2)}</p>
        `;
    }
});

// Exportar e Importar Dados
document.getElementById('exportarDados').addEventListener('click', function() {
    const data = {
        clients: getData('clients'),
        atendimento: getData('atendimento'),
        messageTemplates: getData('messageTemplates'),
        messageLogs: getData('messageLogs')
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "dados_gerenciador_clientes.json";
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('importarArquivo').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Nenhum arquivo selecionado.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            saveData('clients', data.clients || []);
            saveData('atendimento', data.atendimento || []);
            saveData('messageTemplates', data.messageTemplates || []);
            saveData('messageLogs', data.messageLogs || []);
            renderClients();
            renderAtendimento();
            renderTemplates();
            renderLogs();
            generateCalendar();
            alert('Dados importados com sucesso.');
        } catch (error) {
            alert('Erro ao importar dados. Certifique-se de que o arquivo está no formato correto.');
        }
    };
    reader.readAsText(file);
});

// Inicializar Calendário e outras renderizações
document.addEventListener('DOMContentLoaded', function() {
    renderClients();
    renderLogs();
    renderTemplates();
    generateAndCheckCalendar();
    renderAtendimento();
});

//----------------------------------

// Código para enviar os dados do formulário para o Web App
document.getElementById('clientForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    whatsapp: document.getElementById('whatsapp').value,
    instagram: document.getElementById('instagram').value,
    registrationDate: document.getElementById('registrationDate').value,
    lastMessageDate: document.getElementById('lastMessageDate').value,
    status: document.getElementById('status').value,
    appointmentDate: document.getElementById('appointmentDate').value,
    appointmentTime: document.getElementById('appointmentTime').value,
    tattooValue: document.getElementById('tattooValue').value
  };

  fetch('https://script.google.com/macros/s/AKfycbxCCf-W-UH6MMa9JoGYWx4OIWxlzaqGQ7KTCBnOK87uWbKD9kxLi6azP0geq-TYjLyQ/exec', {
    method: 'POST',
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Cliente cadastrado com sucesso!');
      document.getElementById('clientForm').reset();
    } else {
      alert('Erro ao cadastrar cliente!');
    }
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao cadastrar cliente!');
  });
});

// Código para carregar os clientes cadastrados
function loadClients() {
  fetch('https://script.google.com/macros/s/AKfycbxCCf-W-UH6MMa9JoGYWx4OIWxlzaqGQ7KTCBnOK87uWbKD9kxLi6azP0geq-TYjLyQ/exec')
    .then(response => response.json())
    .then(data => {
      const clientsTableBody = document.querySelector('#clientsTable tbody');
      clientsTableBody.innerHTML = '';

      data.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${client.name}</td>
          <td>${client.whatsapp}</td>
          <td>${client.instagram}</td>
          <td>${client.registrationDate}</td>
          <td>${client.lastMessageDate}</td>
          <td>${client.status}</td>
          <td>
            <button onclick="editarCliente('${client.name}')">Editar</button>
            <button onclick="deletarCliente('${client.name}')">Deletar</button>
          </td>
        `;
        clientsTableBody.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar clientes:', error);
    });
}

// Carregar clientes ao abrir a aba "Clientes"
document.querySelector('[data-tab="clientes"]').addEventListener('click', loadClients);
