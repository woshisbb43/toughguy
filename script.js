// 默认配置数据
const DEFAULT_CONFIG = {
  people: [
    "张三",
    "李四",
    "王五",
    "赵六",
    "钱七",
    "孙八",
    "周九",
    "吴十",
    "郑一",
    "刘二"
  ],
  prizes: [
    "一等奖：iPhone 15",
    "二等奖：iPad Air",
    "三等奖：AirPods",
    "四等奖：智能手表",
    "五等奖：蓝牙耳机",
    "纪念奖：保温杯",
    "纪念奖：数据线",
    "纪念奖：鼠标垫"
  ]
};

// 抽奖应用主逻辑
class LotteryApp {
    constructor(originalPrizesHolder) {
        // 初始化状态
        this.people = [...DEFAULT_CONFIG.people]; // 使用默认配置
        this.prizes = [...DEFAULT_CONFIG.prizes]; // 使用默认配置
        this.originalPeople = [...DEFAULT_CONFIG.people]; // 保存原始人员列表，用于重置
        this.originalPrizesHolder = originalPrizesHolder; // 保存原始奖品持有者引用
        this.usedPeople = []; // 已中奖的人员
        this.history = []; // 中奖历史
        this.isRunning = false; // 是否正在抽奖
        this.currentAnimation = null; // 当前动画定时器
        this.animationSpeed = 100; // 动画速度（毫秒）

        // 获取DOM元素
        this.resultText = document.getElementById('resultText');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.configFileInput = document.getElementById('configFile'); // 仍然获取元素，但后面会隐藏相关UI
        this.currentPeopleCount = document.getElementById('currentPeopleCount');
        this.remainingPrizesCount = document.getElementById('remainingPrizesCount');
        this.historyList = document.getElementById('historyList');
        this.currentPeopleList = document.getElementById('currentPeopleList');
        this.remainingPrizesList = document.getElementById('remainingPrizesList');

        // 查找管理链接并绑定事件
        const adminLink = document.querySelector('.admin-link a');
        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                // 如果已有配置，传递给管理页面
                e.preventDefault();
                const config = {
                    people: this.originalPeople || [],
                    prizes: this.originalPrizesHolder ? this.originalPrizesHolder.prizes : []
                };
                const configParam = encodeURIComponent(JSON.stringify(config));
                window.location.href = `admin.html?config=${configParam}`;
            });
        }

        // 绑定事件
        this.bindEvents();
    }
    
    bindEvents() {
        // 开始抽奖
        this.startBtn.addEventListener('click', () => {
            if (!this.isRunning) {
                this.startLottery();
            } else {
                this.stopLottery();
            }
        });

        // 重置
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
    }
    
    // 加载配置文件
    async loadConfig() {
        const file = this.configFileInput.files[0];
        if (!file) {
            alert('请选择配置文件！');
            return;
        }
        
        try {
            const content = await this.readFileAsText(file);
            const config = JSON.parse(content);
            
            if (!Array.isArray(config.people) || !Array.isArray(config.prizes)) {
                throw new Error('配置文件格式错误！请确保包含 people 和 prizes 数组');
            }
            
            this.people = [...config.people];
            this.originalPeople = [...config.people]; // 保存原始列表
            this.prizes = [...config.prizes];
            this.usedPeople = [];
            this.history = [];
            
            // 更新UI
            this.updateInfoPanel();
            this.updateHistoryDisplay();
            this.startBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.resultText.textContent = '配置加载成功，点击开始抽奖';
            this.resultText.classList.remove('winner');
            
            console.log('配置加载成功:', { people: this.people, prizes: this.prizes });
        } catch (error) {
            alert(`加载配置失败: ${error.message}`);
            console.error('配置加载错误:', error);
        }
    }
    
    // 读取文件为文本
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // 开始抽奖
    startLottery() {
        if (this.prizes.length === 0) {
            this.resultText.textContent = '奖品已抽完，抽奖结束！';
            return;
        }

        if (this.people.length === 0) {
            // 人员池为空，重置为原始人员列表
            this.people = [...this.originalPeople];
            this.usedPeople = [];
            this.updateInfoPanel();

            // 显示第二轮抽奖开始的通知
            this.resultText.textContent = '第一轮抽奖结束，第二轮抽奖开始！';
            this.resultText.classList.remove('spinning', 'winner');

            setTimeout(() => {
                this.startLotteryReal();
            }, 2000); // 给用户时间阅读通知
            return;
        }

        this.startLotteryReal();
    }
    
    // 实际开始抽奖逻辑
    startLotteryReal() {
        this.isRunning = true;
        this.startBtn.textContent = '停止';
        
        // 开始动画效果
        this.animateNames();
    }
    
    // 停止抽奖
    stopLottery() {
        this.isRunning = false;
        this.startBtn.textContent = '开始抽奖';

        if (this.currentAnimation) {
            clearInterval(this.currentAnimation);
            this.currentAnimation = null;
        }

        // 如果还有奖品和人，执行一次抽奖
        if (this.prizes.length > 0 && this.people.length > 0) {
            this.drawWinner();
        } else if (this.prizes.length > 0 && this.people.length === 0) {
            // 如果奖品还有但人没了，触发重置
            this.drawWinner(); // drawWinner内部会处理重置逻辑
        }
    }
    
    // 动画效果 - 快速切换人名
    animateNames() {
        if (!this.isRunning) return;
        
        // 清除之前的动画
        if (this.currentAnimation) {
            clearInterval(this.currentAnimation);
        }
        
        this.currentAnimation = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(this.currentAnimation);
                this.currentAnimation = null;
                return;
            }
            
            // 随机显示一个人名
            if (this.people.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.people.length);
                this.resultText.textContent = this.people[randomIndex];
                this.resultText.classList.add('spinning');
            }
        }, this.animationSpeed);
    }
    
    // 抽取中奖者
    drawWinner() {
        if (this.prizes.length === 0) {
            this.resultText.textContent = '奖品已抽完，抽奖结束！';
            this.startBtn.disabled = true;
            return;
        }

        if (this.people.length === 0) {
            // 人员池为空，重置为原始人员列表
            this.people = [...this.originalPeople];
            this.usedPeople = [];
            this.updateInfoPanel();

            // 显示第二轮抽奖开始的通知
            this.resultText.textContent = '第一轮抽奖结束，第二轮抽奖开始！';
            this.resultText.classList.remove('spinning', 'winner');

            // 短暂显示通知后恢复正常
            setTimeout(() => {
                if (this.prizes.length > 0 && this.people.length > 0) {
                    this.resultText.textContent = '点击开始抽奖';
                }
            }, 2000);

            return;
        }

        // 随机选择一个中奖者
        const winnerIndex = Math.floor(Math.random() * this.people.length);
        const winner = this.people[winnerIndex];

        // 从抽奖池中移除中奖者
        this.people.splice(winnerIndex, 1);
        this.usedPeople.push(winner);

        // 随机选择一个奖品
        const prizeIndex = Math.floor(Math.random() * this.prizes.length);
        const prize = this.prizes[prizeIndex];

        // 从奖品池中移除奖品
        this.prizes.splice(prizeIndex, 1);

        // 记录中奖历史
        const record = {
            person: winner,
            prize: prize,
            timestamp: new Date()
        };
        this.history.unshift(record); // 添加到最前面

        // 显示结果
        this.resultText.textContent = `${winner} 获得 ${prize}!`;
        this.resultText.classList.remove('spinning');
        this.resultText.classList.add('winner');

        // 更新信息面板
        this.updateInfoPanel();

        // 更新历史记录显示
        this.updateHistoryDisplay();

        // 检查是否结束
        if (this.prizes.length === 0) {
            setTimeout(() => {
                this.resultText.textContent = '所有奖品已抽出，抽奖结束！';
                this.startBtn.disabled = true;
            }, 2000);
        }
    }
    
    // 更新信息面板
    updateInfoPanel() {
        this.currentPeopleCount.textContent = this.people.length;
        this.remainingPrizesCount.textContent = this.prizes.length;
        this.updateCurrentPeopleList();
        this.updateRemainingPrizesList();
    }

    // 更新当前抽奖人列表
    updateCurrentPeopleList() {
        this.currentPeopleList.innerHTML = '';

        this.people.forEach(person => {
            const li = document.createElement('li');
            li.textContent = person;
            this.currentPeopleList.appendChild(li);
        });
    }

    // 更新剩余奖品列表
    updateRemainingPrizesList() {
        this.remainingPrizesList.innerHTML = '';

        this.prizes.forEach(prize => {
            const li = document.createElement('li');
            li.textContent = prize;
            this.remainingPrizesList.appendChild(li);
        });
    }
    
    // 更新历史记录显示
    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        
        this.history.forEach((record, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="winner-item">${record.person}</span>
                <span class="prize-item">获得 ${record.prize}</span>
            `;
            this.historyList.appendChild(li);
        });
    }
    
    // 重置
    reset() {
        this.people = [...this.originalPeople];
        this.prizes = [...originalPrizesHolder.prizes];
        this.usedPeople = [];
        this.history = [];

        this.isRunning = false;
        if (this.currentAnimation) {
            clearInterval(this.currentAnimation);
            this.currentAnimation = null;
        }

        this.startBtn.textContent = '开始抽奖';
        this.startBtn.disabled = this.originalPeople.length === 0 || this.prizes.length === 0;
        this.resultText.textContent = '已重置，请重新开始';
        this.resultText.classList.remove('spinning', 'winner');

        this.updateInfoPanel();
        this.updateHistoryDisplay();
    }

}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 临时存储原始奖品列表
    const originalPrizesHolder = {
        prizes: []
    };

    // 初始化应用
    const app = new LotteryApp(originalPrizesHolder);

    // 重写重置方法以正确处理奖品列表
    const originalReset = app.reset;
    app.reset = function() {
        this.people = [...this.originalPeople];
        this.prizes = [...this.originalPrizesHolder.prizes];
        this.usedPeople = [];
        this.history = [];

        this.isRunning = false;
        if (this.currentAnimation) {
            clearInterval(this.currentAnimation);
            this.currentAnimation = null;
        }

        this.startBtn.textContent = '开始抽奖';
        this.startBtn.disabled = this.originalPeople.length === 0 || this.prizes.length === 0;
        this.resultText.textContent = '已重置，请重新开始';
        this.resultText.classList.remove('spinning', 'winner');

        this.updateInfoPanel();
        this.updateHistoryDisplay();
    };

    // 初始化配置
    app.initializeConfig = function() {
        // 尝试从本地存储加载配置，如果没有则使用默认配置
        let config = DEFAULT_CONFIG;
        try {
            const storedConfig = localStorage.getItem('lotteryConfig');
            if (storedConfig) {
                const parsedConfig = JSON.parse(storedConfig);
                if (Array.isArray(parsedConfig.people) && Array.isArray(parsedConfig.prizes)) {
                    config = parsedConfig;
                }
            }
        } catch (e) {
            console.warn('无法解析本地存储的配置，使用默认配置:', e);
        }

        this.people = [...config.people];
        this.originalPeople = [...config.people]; // 保存原始列表
        this.prizes = [...config.prizes];
        this.originalPrizesHolder.prizes = [...config.prizes]; // 保存原始奖品列表
        this.usedPeople = [];
        this.history = [];

        // 更新UI
        this.updateInfoPanel();
        this.updateHistoryDisplay();
        this.startBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.resultText.textContent = '配置已加载，点击开始抽奖';
        this.resultText.classList.remove('winner');

        console.log('配置已加载:', { people: this.people, prizes: this.prizes });
    };

    // 初始化配置
    app.initializeConfig();

    // 监听 localStorage 变化，以便在管理页面更新配置时刷新数据
    window.addEventListener('storage', function(e) {
        if (e.key === 'lotteryConfig' && e.newValue !== e.oldValue) {
            try {
                const config = JSON.parse(e.newValue);
                if (Array.isArray(config.people) && Array.isArray(config.prizes)) {
                    // 更新应用数据
                    app.originalPeople = [...config.people];
                    app.people = [...config.people];
                    app.prizes = [...config.prizes];

                    // 更新原始奖品持有者
                    originalPrizesHolder.prizes = [...config.prizes];

                    // 更新UI
                    app.updateInfoPanel();
                    app.updateCurrentPeopleList();
                    app.updateRemainingPrizesList();

                    console.log('配置已从localStorage更新:', config);
                }
            } catch (error) {
                console.error('解析localStorage中的配置失败:', error);
            }
        }
    });

    window.lotteryApp = app; // 将应用实例暴露到全局，便于调试
    window.originalPrizesHolder = originalPrizesHolder; // 暴露到全局以便admin link使用
});