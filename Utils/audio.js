let context,
    audio,
    source,
    biquadFilter,
    panner;

function setupAudio() {
    audio = document.getElementById('audio');
    audio.volume = 0.2;
    if (!context) {
        context = new AudioContext();
        panner = context.createPanner();
        biquadFilter = context.createBiquadFilter();
        source = context.createMediaElementSource(audio);
        source.connect(panner).connect(context.destination);

        panner.connect(biquadFilter);

        biquadFilter.type = 'highshelf';
        biquadFilter.gain.value = 30;
        biquadFilter.frequency.value = 100;
        context.resume();
    }
    
}
function setPannerPosition(x, y, z) {
    panner.setPosition(x, y, z);
}
function initAudio() {
    setupAudio();
    let peakingEnabled = document.getElementById('filterCheckbox');
    peakingEnabled.value = true;
    peakingEnabled.value = document.getElementById('filterCheckbox').value;

    peakingEnabled.addEventListener('change', function () {
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