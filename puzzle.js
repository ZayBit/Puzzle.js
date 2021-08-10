class Puzzle {
    #gameID = '';
    #margin = 0;
    #maxCols = 3;
    #compare = {};
    #compareArr = [];
    #original = [];
    #countSteps = 0;
    #enableSteps = false;
    #endGame = false;
    #width = 0;
    #winAction = false
    #DomElementGame = '';
    #timerActive = false;
    // timer
    #enableTimer = false;
    #second = 0;
    #minute = 0;
    #hour = 0;
    #ms = 0;
    #resetGame = true;
    constructor(gameID, config) {
        const { maxCols = 3, margin = 0, viewSteps = false, timer = false, winAction = false , resetGame = true } = config;
        this.#gameID = gameID
        this.#maxCols = maxCols;
        this.#margin = margin
        this.#enableSteps = viewSteps;
        this.#enableTimer = timer;
        this.#winAction = winAction;
        this.#resetGame = resetGame;
        this.#DomElementGame = document.getElementById(this.#gameID);
        // inicializar las funciones necesarias
        this.#Init()
    }
    #Init() {
        // ajustar imagenes por cada uno de los cuadros
        this.#CreateGridImage()
        // inicializar el sistema de juego
        this.#InitSystem()
        // reset game
        if( this.#resetGame ) this.#ResetGame();
    }
    #ResetGame = ()=> {
        const resetButton = document.querySelector('.reset-game');
        resetButton.addEventListener('click',()=>{
            this.#compare = {}
            this.#compareArr = []
            this.#second = 0;
            this.#minute = 0;
            this.#hour = 0;
            this.#ms = 0;
            this.#endGame = true;
            this.#timerActive = false;
            this.#countSteps = 0;
            let classClear = ['.hour','.minute','.second','.ms','.steps']
            let classClearLength = classClear.length
            for(let i = 0; i < classClearLength ; i++){document.querySelector(classClear[i]).innerHTML = 0}
            this.#DomElementGame.querySelector('.t_empty').classList.add('hidden')
            setTimeout(()=>this.#CreateGrid(),100)
        })
    }
    #CreateGrid = () => {
        this.#endGame = false;
        const spans = this.#DomElementGame.querySelectorAll('span');
        let maxCols = this.#maxCols;
        let countColX = 0,
            countColY = 0,
            margin = this.#margin,
            width = ((this.#DomElementGame.clientWidth + margin) / maxCols) - margin;
        this.#width = width;
        this.#DomElementGame.style.height = `${((width + margin) * maxCols) - margin}px`;
        this.#margin = margin;
        Array.from(spans).sort(() => Math.random() - 0.5).forEach(span => {
            span.style.width = `${width}px`;
            span.style.height = `${width}px`;
            this.#CheckStatus(span.dataset.position, false);
            if (countColX >= maxCols) {
                countColX = 0;
                countColY++;
            }
            span.style.left = (countColX == 0) ? `${0}px` : `${(width * countColX) + margin * countColX}px`;
            span.style.top = (countColY == 0) ? `${0}px` : `${(width * countColY) + margin * countColY}px`;
            countColX++;
        })
    }
    #CreateGridImage = () => {
        const gameTable = this.#DomElementGame
        let maxCols = this.#maxCols,
            total = maxCols * maxCols,
            col = 0,
            count = 0,
            w = gameTable.offsetWidth + (maxCols - 1),
            h = (gameTable.offsetWidth) / maxCols,
            imgSrc = gameTable.querySelector('img').src;
        gameTable.style.height = `${h}px`
        gameTable.classList.add('active')
        for (let x = 0; x < total; x++) {
            if (x == 0) col = 1;
            if (count >= maxCols) {
                count = 0;
                col++;
            }
            let span = document.createElement('span')
            span.classList.add('cutout-image')
            gameTable.appendChild(span)
            let spanStyle = span.style,
                positionY = (col == 1) ? '0px' : `-${(h * (col - 1))}px`,
                width = (count * w / maxCols) + "px";
            spanStyle.opacity = 0
            if (x + 1 < total) {
                span.dataset.position = x + 1;
                span.classList.add(`t${col}`)
                this.#original.push(x + 1)
            } else {
                span.dataset.position = 'empty';
                span.classList.add('t_empty', 'hidden')
                this.#original.push('empty')
            }
            spanStyle.backgroundImage = `url(${imgSrc})`;
            spanStyle.backgroundPosition = `-${width} ${positionY}`;
            spanStyle.backgroundSize = `${w}px ${w}px`;
            spanStyle.opacity = 1
            count++;
        }
    }
    #InitSystem = () => {
        const spans = this.#DomElementGame.querySelectorAll('span');
        this.#CreateGrid()
        spans.forEach(span => {
            span.addEventListener('click', () => {
                if (span.classList.contains('t_empty') || this.#endGame) return;
                if (!this.#timerActive && this.#enableTimer) {
                    console.log('timer');
                    this.#Timer()
                    this.#timerActive = true;
                }
                if (this.#enableSteps) {
                    this.#countSteps++;
                    this.#ViewSteps(this.#countSteps)
                }
                const elEmpty = document.querySelector('.t_empty');
                let position = span.dataset.position,
                    thisLeft = span.style.left,
                    thisTop = span.style.top,
                    emptyLeft = elEmpty.style.left,
                    emptyTop = elEmpty.style.top;
                
                if (this.#CheckPosition(parseInt(span.style.left), parseInt(elEmpty.style.left))) {
                    if (thisTop != emptyTop) return;
                    span.style.left =  emptyLeft;
                    elEmpty.style.left = thisLeft;
                    this.#IsWinner(position)
                }
                if (this.#CheckPosition(parseInt(span.style.top), parseInt(elEmpty.style.top))) {
                    if (thisLeft != emptyLeft) return;
                    span.style.top = emptyTop;
                    elEmpty.style.top = thisTop;
                    this.#IsWinner(position)
                }
            })
        })
    }
    #CheckPosition = (thisPosition, emptyPosition) => {
        for (let i = 0; i < 2; i++) {
            let currentOperation = (i == 0) ? thisPosition + (this.#width + this.#margin) : thisPosition - (this.#width + this.#margin)
            if (Math.round(currentOperation) == emptyPosition || Math.ceil(currentOperation) == emptyPosition || parseInt(currentOperation) == emptyPosition) {
                return true;
            }
        }
        return false
    }
    #CheckStatus = (index, each = true) => {
        let completeGame = false,
            countError = 0,
            original = this.#original,
            compare = this.#compare,
            compareArr = this.#compareArr;
        if (compare[index] != index) {
            compare[index] = index;
            compareArr.push(index)
        }
        if (each) {
            compareArr.map((num, i) => {
                if (num == index) {
                    compareArr[i] = 'empty'
                } else if (num == 'empty') {
                    compareArr[i] = index
                } else if (num != index || num != 'empty') {
                    compareArr[i] = num
                }
            })
            original.forEach((num, i) => {
                if (num != compareArr[i]) {
                    countError++;
                }
                if (i >= original.length - 1 && !countError) {
                    completeGame = true;
                }
            })
            return completeGame
        }
    }
    #Timer = () => {
        const hour = document.querySelector('.hour'),
            minute = document.querySelector('.minute'),
            second = document.querySelector('.second'),
            ms = document.querySelector('.ms');
        let interval = setInterval(() => {
            this.#ms++;
            ms.innerHTML = this.#ms
            if (this.#ms >= 100) {
                this.#second++
                second.innerHTML = this.#second
                this.#ms = 0
            }
            if (this.#second == 60) {
                this.#minute++;
                minute.innerHTML = this.#minute
                this.#second = 0;
            }
            if (this.#minute == 60) {
                this.#hour++;
                hour.innerHTML = this.#hour
                this.#minute = 0;
            }
            if (this.#endGame) {
                ms.innerHTML = 0;
                clearInterval(interval)
            }
        }, 10)
    }
    #ViewSteps = (count) => {
        const steps = document.querySelector('.steps');
        steps.innerHTML = count;
    }
    #IsWinner = (position) => {
        if (this.#CheckStatus(position)) {
            this.#endGame = true;
            if (typeof this.#winAction === 'function') {
                this.#winAction({
                    steps: this.#countSteps,
                    time: {
                        hours: this.#hour,
                        minutes: this.#minute,
                        seconds: this.#second,
                        ms: this.#ms
                    }
                })
            }
            this.#DomElementGame.querySelector('.t_empty').classList.remove('hidden')
            setTimeout(() => {
                let spans = this.#DomElementGame.querySelectorAll('span');
                spans.forEach((el,i) => {
                    if(i >= spans.length-1){
                        // this.#DomElementGame.querySelector('img').style.opacity = 1
                    }
                })
            }, 100)
        }
    }
}
new Puzzle('game', {
    maxCols: 3,
    margin: 3,
    viewSteps: true,
    timer: true,
    winAction: (data) => {
        const { steps, time } = data;
        const { hours, minutes, seconds, ms } = time;
        console.log(`he ganado con solo ${steps} pasos y con ${hours} horas , ${minutes} minutos , ${seconds} segundos y ${ms} milisegundos`);
    }
})

