Vue.component('modal', {
    template: `
        <div class="modal-backdrop">
            <div class="modal">
                <slot></slot>
            </div>
        </div>
    `
});

Vue.component('date-picker', {
    props: ['value'],
    template: `
        <input type="date" :value="value" @input="$emit('input', $event.target.value)" />
    `
});

Vue.component('card', {
    props: ['card', 'columnIndex', 'cardIndex'],
    template: `
        <div class="card" :class="{ completed: card.completed, overdue: card.overdue }">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <p><strong>Дэдлайн:</strong> {{ card.deadline }}</p>
            <p><strong>Создано:</strong> {{ card.createdAt }}</p>
            <p><strong>Обновлено:</strong> {{ card.updatedAt }}</p>
            <date-picker v-model="card.deadline"></date-picker>
            <button @click="$emit('edit-card', columnIndex, cardIndex)">Редактировать</button>
            <button v-if="columnIndex < 3" @click="$emit('move-card', columnIndex, columnIndex + 1, cardIndex)">Переместить в следующую колонку</button>
            <button v-if="columnIndex === 2" @click="$emit('move-card', columnIndex, columnIndex - 1, cardIndex)">Вернуть в предыдущую колонку</button>
            <button v-if="columnIndex === 0 || columnIndex === 3" @click="$emit('remove-card', columnIndex, cardIndex)">Удалить</button>
            <p v-if="card.returnReason"><strong>Причина возврата:</strong> {{ card.returnReason }}</p>
        </div>
    `
});

Vue.component('board', {
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', cards: [] },
                { title: 'Задачи в работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Выполненные задачи', cards: [] }
            ],

            isModalOpen: false,
            isEditing: false,
            editData: {
                colIndex: null,
                cardIndex: null,
                title: '',
                description: '',
                deadline: ''
            }
        };
    },
    mounted() {
        this.loadData();
    },
    methods: {
        openCreateModal(columnIndex) {
            this.isEditing = false;
            this.editData = {
                colIndex: columnIndex,
                cardIndex: null,
                title: '',
                description: '',
                deadline: new Date().toISOString().split('T')[0]
            };
            this.isModalOpen = true;
        },
        openEditModal(columnIndex, cardIndex) {
            this.isEditing = true;
            const card = this.columns[columnIndex].cards[cardIndex];
            this.editData = {
                colIndex: columnIndex,
                cardIndex: cardIndex,
                title: card.title,
                description: card.description,
                deadline: card.deadline
            };
            this.isModalOpen = true;
        },
        saveCard() {
            const { colIndex, cardIndex, title, description, deadline } = this.editData;
            if (!title || !description) return alert("Заполните все поля!");

            const timestamp = new Date().toLocaleString();

            if (this.isEditing) {
                const card = this.columns[colIndex].cards[cardIndex];
                card.title = title;
                card.description = description;
                card.deadline = deadline;
                card.updatedAt = timestamp;
                this.checkOverdue(card);
            } else {
                const newCard = {
                    title,
                    description,
                    deadline,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    completed: false,
                    overdue: false
                };
                this.columns[colIndex].cards.push(newCard);
                this.checkOverdue(newCard);
            }

            this.saveData();
            this.isModalOpen = false;
        },


        addCard(columnIndex) {
            const title = prompt("Введите заголовок задачи:");
            const description = prompt("Введите описание задачи:");
            const deadline = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toLocaleString();

            if (title && description) {
                const newCard = {
                    title,
                    description,
                    deadline,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    completed: false,
                    overdue: false
                };
                this.columns[columnIndex].cards.push(newCard);
                this.saveData();
            }
        },
        editCard(columnIndex, cardIndex) {
            const card = this.columns[columnIndex].cards[cardIndex];
            const title = prompt("Введите заголовок задачи:", card.title);
            const description = prompt("Введите описание задачи:", card.description);
            const timestamp = new Date().toLocaleString();

            if (title && description) {
                card.title = title;
                card.description = description;
                card.updatedAt = timestamp;
                this.saveData();
            }
        },
        removeCard(columnIndex, cardIndex) {
            if (confirm("Вы уверены, что хотите удалить эту карточку?")) {
                this.columns[columnIndex].cards.splice(cardIndex, 1);
                this.saveData();
            }
        },
        moveCard(sourceColumnIndex, targetColumnIndex, cardIndex) {
            const card = this.columns[sourceColumnIndex].cards[cardIndex];

            if (targetColumnIndex === 1 && sourceColumnIndex === 2) {
                const reason = prompt("Введите причину возврата:");
                if (reason) {
                    card.returnReason = reason;
                }
            }

            this.columns[targetColumnIndex].cards.push(card);
            this.columns[sourceColumnIndex].cards.splice(cardIndex, 1);
            this.checkOverdue(card);
            this.saveData();
        },
        checkOverdue(card) {
            const today = new Date().setHours(0,0,0,0);
            const deadline = new Date(card.deadline).setHours(0,0,0,0);
            card.overdue = deadline < today;
        },
        saveData() {
            localStorage.setItem('kanbanData', JSON.stringify(this.columns));
        },
        loadData() {
            const data = localStorage.getItem('kanbanData');
            if (data) {
                this.columns = JSON.parse(data);
                this.columns.forEach(column => {
                    column.cards.forEach(card => {
                        this.checkOverdue(card);
                    });
                });
            }
        }
    },
    template: `
        <div class="board">
            <div class="column" v-for="(column, index) in columns" :key="index">
                <h2>{{ column.title }}</h2>

                <button v-if="index === 0" @click="openCreateModal(index)">Добавить задачу</button>
                
                <div v-for="(card, cardIndex) in column.cards" :key="cardIndex">
                    <card 
                        :card="card" 
                        :columnIndex="index" 
                        :cardIndex="cardIndex" 
                        @move-card="moveCard" 
                        @edit-card="openEditModal" 
                        @remove-card="removeCard">                       
                    </card>
                </div>
            </div>
            
            <modal v-if="isModalOpen">
                <h3>{{ isEditing ? 'Редактирование задачи' : 'Новая задача' }}</h3>
                <div class="modal-form">
                    <input v-model="editData.title" placeholder="Заголовок">
                    <textarea v-model="editData.description" placeholder="Описание"></textarea>
                    <input type="date" v-model="editData.deadline">
                    <div class="modal-buttons">
                        <button @click="saveCard">ОК</button>
                        <button @click="isModalOpen = false">Отмена</button>
                    </div>
                </div>
            </modal>
        </div>
    `
});

new Vue({
    el: '#app'
});