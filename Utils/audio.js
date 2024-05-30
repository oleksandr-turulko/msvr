let context,
    audio,
    source,
    biquadFilter,
    panner;

function setupAudio() {
    audio = document.getElementById('audio');

    audio.addEventListener('play', () => {
        if (!context) {
            context = new AudioContext();
            source = context.createMediaElementSource(audio);
            panner = context.createPanner();
            biquadFilter = context.createBiquadFilter();

            source.connect(panner);
            panner.connect(biquadFilter);
            biquadFilter.connect(context.destination);

            biquadFilter.type = 'highshelf';
            biquadFilter.gain.value = 25;
            biquadFilter.frequency.value = 100;
            context.resume();
        }
    })
    audio.addEventListener('pause', () => {
        console.log('pause');
        context.resume();
    })
}

function initAudio() {
    setupAudio();
    const peakingEnabled = document.getElementById('filterCheckbox');
    peakingEnabled.addEventListener('change', function() {
        if (peakingEnabled.checked) {
            panner.disconnect();
            panner.connect(biquadFilter);
            biquadFilter.connect(context.destination);
        } else {
            panner.disconnect();
            panner.connect(context.destination);
        }
    });
    audio.play();
}