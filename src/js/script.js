import {
  getRandomNumber,
  getCssProp,
  detectColision,
  roundNum,
} from "../utils/utils.js";

Object.assign(window, {
  detectColision,
});

let game,
  block,
  hole,
  character,
  score,
  gameoverscreen,
  star,
  gameStopped,
  Jumping,
  scoreTotal,
  scoreCount,
  gameSpeed,
  gravityStopped;

function getElements() {
  // выгружаю элементы.
  game = document.getElementById("game");
  block = document.getElementById("block");
  hole = document.getElementById("hole");
  character = document.getElementById("character");
  score = document.getElementById("score");
  gameoverscreen = document.getElementById("gameoverscreen");
  star = document.getElementById("star");
}

function initRandomHoles() {
  hole.addEventListener("animationiteration", () => {
    const fromHeight = (57 * window.innerHeight) / 100;
    const toHeight = (97 * window.innerHeight) / 100;

    const randomTop = getRandomNumber(fromHeight, toHeight);
    hole.style.top = `-${randomTop}px`;
  });
}
// гравитация + положение анимации.
function beginGravity() {
  setInterval((_) => {
    if (Jumping || gravityStopped) return;
    changeGameState({ diff: 5, direction: "down" });
  }, 20);
}

function setInitialValues() {
  gravityStopped = false;
  gameStopped = false;
  Jumping = false;
  Jumping = 0;
  scoreTotal = 0;
  gameSpeed = "slow";
}

function startGravity() {
  gravityStopped = false;
}
function stopGravity() {
  gravityStopped = true;
}

function setEventListeners() {
  window.addEventListener("resize", () => {
    if (gameStopped) return;
    resetAllAnim();
  });
  gameoverscreen.querySelector("button").addEventListener("click", (_) => {
    gameSpeed = "slow";
    hideGameOverScreen();
    startGravity();
    resetAllAnim();
    resetCharacterPos();
    resetScore();
    changeScoreUi();
    startBgAnimation();

    setTimeout((_) => {
      gameStopped = false;
    });
  });
  document.body.parentElement.addEventListener("click", () => {
    if (gameStopped) return;
    characterJump();
  });
  document.onkeypress = (e) => {
    e = e || window.event;

    if (e.keyCode === 32) {
      if (gameStopped) return;

      characterJump();
    }
  };
}

function gameOver() {
  new Audio("/sounds/sounds_gameover.wav").play();
  gameStopped = true;
  showGameOverScreen();
  stopBlockAnimation();
  stopGravity();
  hideStar();
  stopBgAnimation();
}

function resetCharacterPos() {
  character.style.top = "30vh";
  character.style.left = "25vw";
}

function resetScore() {
  scoreTotal = 0;
}
// ui панель рекорда
function changeScoreUi() {
  score.innerText = `Score ${scoreTotal.toString()}`;
  gameoverscreen.querySelector(".score").innerText = score.innerText;
}

const gameSpeedConfig = {
  slow: 150,
  normal: 250,
  fast: 350,
  superfast: 450,
  ridiculous: 550,
};

function resetAllAnim() {
  // let seconds = 1.5; // статичное ускорение
  let seconds = roundNum(window.innerWidth / gameSpeedConfig[gameSpeed]); // ускорение, пока хуй знает чому не воркает.
  const blockAnimationCss = `blockAnimation ${seconds}s infinite linear`;
  block.style.animation = blockAnimationCss;
  hole.style.animation = blockAnimationCss;

  if (star.style.display !== "none") return;

  const num = getRandomNumber(1, 5);
  const starAnimationCss = `starAnimation${num} ${seconds}s infinite linear`;
  star.style.animation = starAnimationCss;
}

function stopBlockAnimation() {
  const blockLeft = block.getBoundingClientRect().x;
  block.style.animation = "";
  hole.style.animation = "";

  block.style.left = `${blockLeft}px`;
  hole.style.left = `${blockLeft}px`;
}

// анимация вверх. функция возвразщает положение. *fixed
function characterJump() {
  Jumping = true;
  let jumpCount = 0;

  const jumpInterval = setInterval((_) => {
    changeGameState({ diff: -3, direction: "up" });

    if (jumpCount > 20) {
      new Audio("/sounds/sounds_fly.mp3").play();

      clearInterval(jumpInterval);
      Jumping = false;
      jumpCount = 0;
    }
    jumpCount++;
  }, 10);
}

function changeGameState({ diff, direction }) {
  handleStarDetection();
  handleGameSpeed();
  handleCharacterAnim(direction);
  handleCharacterCollision();
  handleCharacterPos(diff);
}

function handleStarDetection() {
  if (star.style.display === "none") return;

  if (detectColision(character, star)) {
    new Audio("/sounds/sounds_star.wav").play();
    scoreTotal += 150;
    hideStar();
    changeScoreUi();
  }
}

function handleGameSpeed() {
  let doReset = false;

  if (scoreTotal > 5000) {
    gameSpeed = "ridiculous";
    doReset = true;
  } else if (scoreTotal > 2000) {
    gameSpeed = "superfast";
    doReset = true;
  } else if (scoreTotal > 650) {
    gameSpeed = "fast";
    doReset = true;
  } else if (scoreTotal > 750) {
    gameSpeed = "normal";
    doReset = true;
  } else if (scoreTotal > 250) {
    gameSpeed = "normal";
    doReset = true;
  }

  if (doReset) {
    const timeoutLength =
      gameSpeedConfig[gameSpeed] * (gameSpeedConfig[gameSpeed] / 10);

    setTimeout((_) => {
      if (gameStopped) return;

      resetAllAnim();
    }, timeoutLength);
  }
}

function handleCharacterAnim(direction) {
  if (direction === "down") {
    character.classList.remove("go-up");
    character.classList.add("go-down");
  } else if (direction === "up") {
    character.classList.add("go-up");
    character.classList.remove("go-down");
  }
}

let numOfHoles = 0;
let soundCount = 0;

function handleCharacterCollision() {
  const colisionBlock = detectColision(character, block);
  const colisionHole = detectColision(character, hole, { y1: -46, y2: 47 }); // fixed нижний блок пролетал мимо.

  if (colisionBlock && !colisionHole) {
    changeScoreUi();
    return gameOver();
  } else if (colisionHole) {
    scoreTotal++;

    soundCount++;
    if (soundCount > 35) {
      new Audio("/sounds/sounds_hole.wav").play();
      soundCount = 0;
    }
    changeScoreUi();
    if (gameStopped) return;
    numOfHoles++;
    if (numOfHoles > 150) {
      numOfHoles = 0;
      showStar();
      setTimeout((_) => hideStar(), 1500);
    }
  }
}

function handleCharacterPos(diff) {
  const cTop = parseInt(getCssProp(character, "top"));
  const changeTop = cTop + diff;

  if (changeTop < 0) {
    return;
  }
  if (changeTop > window.innerHeight) {
    return gameOver();
  }
  character.style.top = `${changeTop}px`;
}

function startBgAnimation() {
  game.style.animation = "backgroundAnimation 5s infinite linear";
}

function stopBgAnimation() {
  game.style.animation = "";
}

function showGameOverScreen() {
  gameoverscreen.style.display = "";
}

function hideGameOverScreen() {
  gameoverscreen.style.display = "none";
}

function showStar() {
  if (star.style.display !== "none") return;

  star.style.display = "";
  star.style.top = `${getRandomNumber(20, 70)}%`;
}
function hideStar() {
  star.style.display = "none";
}

function gameInit() {
  getElements();
  changeScoreUi;
  initRandomHoles();
  beginGravity();
  setInitialValues();
  resetAllAnim();
  setEventListeners();
  startBgAnimation();
}
gameInit();
