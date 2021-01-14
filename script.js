'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// Create app class
// Get the position with geolocator
// Use position to load leaflet api map onto the screen (with marker on current location)
// When map is clicked, show the form 
// When form is submitted, save all values and create the correct object, push object into array and display on list and marker on map


class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${this.type[0].toUpperCase()}${this.type.slice(1)}`
    }
}

class Running extends Workout {

    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.pace = this._pace();
        this.description = this._setDescription();
    }

    _pace() {
        return this.distance / this.duration;
    }
}

class Cycling extends Workout {

    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.speed = this._speed();
        this.description = this._setDescription();
    }

    _speed() {
        return this.distance / (this.duration / 60);
    }
}

const run1 = new Running([12,12], 12, 13, 45);
const cycle1 = new Cycling([17,7], 77, 56, 23);


class App {

    #mapI;
    #workouts = [];

    constructor() {
        // Get position
        this._getPosition();

        // Add event listeners
        form.addEventListener('submit', this._newWorkout.bind(this))
        inputType.addEventListener('change', this._toggleElevationField)

    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                console.log('Error getting position');
            })
        }
    }

    _loadMap(pos){
        const lat = pos.coords.latitude;
        const long = pos.coords.longitude;
        const coords = [lat, long];

        var map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker(coords).addTo(map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();


        map.on('click', this._showForm.bind(this));
    }

    _showForm(mapInfo){
        this.#mapI = mapInfo;
        form.classList.remove('hidden')
        inputDistance.focus();
    }

    _hideForm(){
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
        form.classList.add('hidden')
    }

    _toggleElevationField(){
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e){
        e.preventDefault()

        // get values from form
        const markedLat = this.#mapI.latlng.lat
        const markedLng =  this.#mapI.latlng.lng
        const markedCoords = [markedLat, markedLng];

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        let workout;

        // create new object from values
        if(type === 'running'){
            const cadence = +inputCadence.value;

            workout = new Running(markedCoords, distance, duration, cadence);

        }

        if(type === 'cycling'){
            const elevationGain = +inputElevation.value;

            workout = new Cycling(markedCoords, distance, duration, elevationGain);

        }

        // add new object to array
        this.#workouts.push(workout);

        // add new workout to list
        this._renderWorkout(workout);

        // add new workout marker to map
        // this._renderWorkoutMarker(workout);

        // hide form + clear values
        this._hideForm();
    }

    _renderWorkout(workout){
        const html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">🏃‍</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

        if(workout.type === 'running'){
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
                </li>
            `;
        }

        if(workout.type === 'cycling'){
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed}</span>
                <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
                </li>
            `;
        }

            console.log(html);



    }


}



let app = new App;
