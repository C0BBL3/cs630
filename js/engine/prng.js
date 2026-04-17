(function() {

    class Prng {

        constructor(seed) {
            this._state = seed | 0;
        }

        next() {
            this._state |= 0;
            this._state = (this._state + 0x6D2B79F5) | 0;

            let t = Math.imul(this._state ^ (this._state >>> 15), 1 | this._state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }

        nextInt(min, max) {
            const range = max - min + 1;
            const raw = this.next();
            return min + Math.floor(raw * range);
        }

    }

    window.DCN.engine.Prng = Prng;

})();
