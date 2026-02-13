Vue.component('board', {
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', cards: [] },
                { title: 'Задачи в работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Выполненные задачи', cards: [] }
            ]
        };
    },
    created() {
        this.loadData();
    },
    methods: {
        checkOverdue(card) {
            const today = new Date();
            const deadline = new Date(card.deadline);
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
                <button v-if="index === 0" @click="addCard(index)">Добавить задачу</button>
                <div v-for="(card, cardIndex) in column.cards" :key="cardIndex" class="card" :class="{ completed: card.completed, overdue: card.overdue }">
                    <h3>{{ card.title }}</h3>
                    <p>{{ card.description }}</p>
                    <p><strong>Дэдлайн:</strong> {{ card.deadline }}</p>
                    <p><strong>Создано:</strong> {{ card.createdAt }}</p>
                    <p><strong>Обновлено:</strong> {{ card.updatedAt }}</p>
                    <button @click="editCard(index, cardIndex)">Редактировать</button>
                    <button v-if="index < 3" @click="moveCard(index, index + 1, cardIndex)">Переместить в следующую колонку</button>
                    <button v-if="index === 3" @click="moveCard(index, index - 1, cardIndex)">Вернуть в предыдущую колонку</button>
                    <button v-if="index === 0" @click="removeCard(index, cardIndex)">Удалить</button>
                    <button v-if="index === 3" @click="removeCard(index, cardIndex)">Удалить</button>
                    <p v-if="card.returnReason"><strong>Причина возврата:</strong> {{ card.returnReason }}</p>
                </div>
            </div>
        </div>
    `
});

new Vue({
    el: '#app'
});