(function() {

    class Link {

        constructor(id, from, to, bandwidth, latency) {
            this.id = id;
            this.from = from;
            this.to = to;
            this.bandwidth = bandwidth;
            this.latency = latency;
            this.inFlightQueue = [];
        }

        calcTransmissionDelay(packetSizeBytes) {
            return packetSizeBytes / this.bandwidth;
        }

        calcTotalDelay(packetSizeBytes) {
            const transmissionDelay = this.calcTransmissionDelay(packetSizeBytes);
            return this.latency + transmissionDelay;
        }

    }

    window.DCN.engine.Link = Link;

})();
