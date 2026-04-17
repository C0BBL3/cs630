(function() {

    class EventQueue {

        constructor() {
            this._heap = [];
        }

        enqueue(event) {
            this._heap.push(event);
            this._bubbleUp(this._heap.length - 1);
        }

        dequeue() {
            if (this._heap.length == 0) {
                return null;
            }

            const min = this._heap[0];
            const last = this._heap.pop();

            if (this._heap.length > 0) {
                this._heap[0] = last;
                this._sinkDown(0);
            }

            return min;
        }

        peek() {
            if (this._heap.length == 0) {
                return null;
            }

            return this._heap[0];
        }

        getSize() {
            return this._heap.length;
        }

        ///////////////////////////////////////
        // HELPERS

        _bubbleUp(index) {
            let current = index;

            while (current > 0) {
                const parentIndex = Math.floor((current - 1) / 2);
                const parentEvent = this._heap[parentIndex];
                const currentEvent = this._heap[current];

                if (currentEvent.t >= parentEvent.t) {
                    break;
                }

                this._heap[parentIndex] = currentEvent;
                this._heap[current] = parentEvent;
                current = parentIndex;
            }
        }

        _sinkDown(index) {
            const length = this._heap.length;
            let current = index;

            while (true) {
                const leftIndex = 2 * current + 1;
                const rightIndex = 2 * current + 2;
                let smallest = current;

                if (leftIndex < length && this._heap[leftIndex].t < this._heap[smallest].t) {
                    smallest = leftIndex;
                }

                if (rightIndex < length && this._heap[rightIndex].t < this._heap[smallest].t) {
                    smallest = rightIndex;
                }

                if (smallest == current) {
                    break;
                }

                const temp = this._heap[current];
                this._heap[current] = this._heap[smallest];
                this._heap[smallest] = temp;
                current = smallest;
            }
        }

    }

    window.DCN.engine.EventQueue = EventQueue;

})();
