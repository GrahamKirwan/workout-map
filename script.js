'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


// Get the position with geolocator
// Use position to load leaflet api map onto the screen (with marker on current location)
// When map is clicked, show the form 
// When form is submitted, show marker on map where click was

class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    _click(){
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.pace = this.pace();
        this._setDescription();
    }

    pace() {
        return this.duration / this.distance;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.speed = this.speed();
        this._setDescription();
    }

    speed() {
        return this.distance / (this.duration / 60);
    }
}

let run1 = new Running([12,12], 12, 23, 23);
let cycle1 = new Cycling([12,12], 12, 23, 23);


class App {

    #map;
    #mapI;
    #workouts = [];

    constructor() {
        // Get users position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Put two event listeners here
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition(){
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                console.log('error');
            });
        }

    }

    _loadMap(pos) {
        const lat = pos.coords.latitude;
        const long = pos.coords.longitude;
        const coords = [lat, long];


        // Load map on screen with given coords + add marker
        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        L.marker(coords).addTo(this.#map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();


        // When map is clicked, show the form 
        this.#map.on('click', this._showForm.bind(this));

        // Load markers from local storage (put here becuase map has to load before markers can render)
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        })
        
    }


    _showForm(mapInfo) {
        this.#mapI = mapInfo;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(function(){form.style.display = 'grid';}, 1000);
    }

    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;

        var markedLat = this.#mapI.latlng.lat;
        var markedLong = this.#mapI.latlng.lng;
        var markedCoords = [markedLat, markedLong];


        // If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Check if data is valid
            if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) {
                return alert('Inputs have to be numbers');
            }

            workout = new Running(markedCoords, distance, duration, cadence);
        }

        // If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            // Check if data is valid
            if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(elevation)) {
                return alert('Inputs have to be numbers');
            }

            workout = new Cycling(markedCoords, distance, duration, elevation);
        }

        // Add new object to workout array
        this.#workouts.push(workout);
        console.log(this.#workouts);

        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Clear form values + hide form
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();


    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })
            .setContent(`${workout.type === 'running' ? '🏃' : '🚴‍' } ${workout.description}`)
        )
        .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚴‍' }️</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

        if(workout.type === 'running') {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">👟</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
                </li>
            `
        }

        if(workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
                </li>
            `
        }

        form.insertAdjacentHTML('afterend', html);

    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return;

        // Find the workout object from the workouts array that matches the id of the clicked li
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        

        this.#map.setView(workout.coords, 13)
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data) return;

        this.#workouts = data;

        // Loop through the workouts array that was saved in local storage and render each
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }
}

let app = new App();







