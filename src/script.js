'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputTemp = document.querySelector('.form__input--temp');
const inputClimb = document.querySelector('.form__input--climb');

class Workout {
  date = new Date();

  // Unique id(test)
  id = (Date.now() + '').slice(-10);

  constructor (coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription () {
    this.type == 'running'
      ? this.description = `Пробежка ${new Intl.DateTimeFormat('ru-RU').format(this.date)}`
      : this.description = `Велотренировка ${new Intl.DateTimeFormat('ru-RU').format(this.date)}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor (coords, distance, duration, temp) {
    super(coords, distance, duration);
    this.temp = temp;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace () {
    // min/km
    this.pace = this.duration / this.distance;
  }

  setHtml () {
    return `
        <div class="workout__details">
          <span class="workout__icon">📏⏱</span>
          <span class="workout__value">${this.pace.toFixed(2)}</span>
          <span class="workout__unit">мин/км</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">👟⏱</span>
          <span class="workout__value">${this.temp}</span>
          <span class="workout__unit">шаг/мин</span>
        </div>
      </li>
      `;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor (coords, distance, duration, climb) {
    super(coords, distance, duration);
    this.climb = climb;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed () {
    // km/h
    this.speed = this.distance / (this.duration / 60);
  }

  setHtml () {
    return ` 
        <div class="workout__details">
          <span class="workout__icon">📏⏱</span>
          <span class="workout__value">${this.speed.toFixed(2)}</span>
          <span class="workout__unit">км/ч</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🏔</span>
          <span class="workout__value">${this.climb}</span>
          <span class="workout__unit">м</span>
        </div>
      </li>
      `;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor () {
    //Получение местоположения пользователя
    this._getPosition();

    //Получение данных из LocalStorage
    this._getLocalStorageData();

    // Доавление обработчиков событий
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleClimbField);
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
  }

  _getPosition () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Geolocation is not supported!');
        });
    }
  }

  _loadMap (position) {
    const coords = [position.coords.latitude, position.coords.longitude];

    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    // Обработка кликов на карте
    this.#map.on('click', this._showForm.bind(this));

    //Оторбражение тренировок из LocalStorage на карте
    this.#workouts.forEach(workout => {
      this._displayWorkout(workout);
    });
  }

  _showForm (event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm () {
    inputDistance.value = inputDuration.value = inputTemp.value = inputClimb.value = '';
    form.classList.add('hidden');
  }

  _toggleClimbField () {
    inputClimb.closest('.form__row').classList.toggle('form__row--hidden');
    inputTemp.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout (event) {
    event.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Получить данный из формы
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // Проверка валидности данных
    const areNumbers = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const areNumbersPositive = (...numbers) =>
      numbers.every(num => num > 0);

    // Если тренировка являеться пробежкой, создать объект Running
    if (type === 'running') {
      const temp = +inputTemp.value;
      //Проверка валидности данных
      if (!areNumbers(distance, duration, temp) || !areNumbersPositive(distance, duration, temp))
        return alert('Введите положительное число');

      workout = new Running([lat, lng], distance, duration, temp);
    }

    // Если тренировка являеться велотренировкой, создать объект Cycling
    if (type === 'cycling') {
      const climb = +inputClimb.value;
      //Проверка валидности данных
      if (!areNumbers(distance, duration, climb) || !areNumbersPositive(distance, duration))
        return alert('Введите положительное число');

      workout = new Cycling([lat, lng], distance, duration, climb);
    }

    // Добавить новый объект в массив тренировок
    this.#workouts.push(workout);
    console.log(this.#workouts);

    // Отобразить тренировку на карте
    this._displayWorkout(workout);

    // Отобразить тренировку в списке
    this._displayWorkoutOnSidebar(workout);

    // Спрятать форму и очистить поля ввода данных
    this._hideForm();
    inputDistance.value = inputDuration.value = inputTemp.value = inputClimb.value = '';

    // Добавление тренировок в LocalStorage
    this._addWorkoutsToLocalStorage();
  }

  _displayWorkout (workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 200,
        minWidth: 200,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      }))
      .setPopupContent(`${workout.type === 'running' ? '🏃' : '🚵'} ${workout.description}`)
      .openPopup();
  }

  _displayWorkoutOnSidebar (workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚵'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">км</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">мин</span>
        </div>
        ${workout.setHtml()}
    `;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToWorkout (event) {
    const workoutElement = event.target.closest('.workout');

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      item => item.id === workoutElement.dataset.id);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _addWorkoutsToLocalStorage () {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorageData () {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    // Когда достаём из LocalStorage данные, то они теряют свою связь с прототипами классов
    // Вручную преобразовываем объекты в экземпляры нужных классов
    this.#workouts = data.map(workout => {
      if (workout.type === 'running') {
        return Object.assign(new Running(), workout);
      }
      if (workout.type === 'cycling') {
        return Object.assign(new Cycling(), workout);
      }
    });
    this.#workouts.forEach(workout => {
      this._displayWorkoutOnSidebar(workout);
    });
  }

  reset(){
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
