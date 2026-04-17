(function() {

    const EventQueue = DCN.engine.EventQueue;

    class Simulator {

        static simulate(topology, schedule) {
            if (schedule.length == 0) {
                return { events: [], completionTime: 0, linkUtilizations: {} };
            }

            const graph = topology.buildGraph();
            const allPairsBfs = Simulator._precomputeAllPairsBfs(graph);
            const linkLookup = Simulator._buildLinkLookup(graph);
            const sendsByPhase = Simulator._groupByPhase(schedule);

            const phaseKeys = Object.keys(sendsByPhase);
            const phaseNumbers = phaseKeys.map(Number);
            phaseNumbers.sort(Simulator._compareNumbers);

            const timeline = [];
            let phaseStartTime = 0;

            for (let phaseNum of phaseNumbers) {
                const phaseSends = sendsByPhase[phaseNum];
                const phaseEndTime = Simulator._simulatePhase(
                    phaseSends,
                    phaseStartTime,
                    allPairsBfs,
                    linkLookup,
                    timeline,
                );
                phaseStartTime = phaseEndTime;
            }

            const completionTime = phaseStartTime;
            const linkUtilizations = Simulator._calcLinkUtilizations(linkLookup, completionTime);

            timeline.sort(Simulator._compareByTime);

            return { events: timeline, completionTime, linkUtilizations };
        }

        ///////////////////////////////////////
        // HELPERS

        static _simulatePhase(sends, phaseStartTime, allPairsBfs, linkLookup, timeline) {
            const eventQueue = new EventQueue();
            let deliveredCount = 0;
            const totalPackets = sends.length;
            let latestDeliveryTime = phaseStartTime;

            // INJECT: schedule all first hops at phaseStartTime

            for (let send of sends) {
                const predecessors = allPairsBfs[send.fromNode].predecessors;
                const path = Simulator._reconstructPath(predecessors, send.fromNode, send.toNode);

                if (path.length == 0) {
                    deliveredCount++;
                    continue;
                }

                const firstHop = path[0];
                const hopResult = Simulator._processHop(
                    firstHop.from,
                    firstHop.to,
                    send.sizeBytes,
                    phaseStartTime,
                    linkLookup,
                );

                timeline.push({
                    t: hopResult.transmitStart,
                    type: 'send',
                    linkId: hopResult.linkId,
                    packetId: send.packetId,
                    fromNode: firstHop.from,
                    toNode: firstHop.to,
                });

                eventQueue.enqueue({
                    t: hopResult.arriveTime,
                    _packetId: send.packetId,
                    _path: path,
                    _hopIndex: 0,
                    _sizeBytes: send.sizeBytes,
                    _linkId: hopResult.linkId,
                    _fromNode: firstHop.from,
                    _toNode: firstHop.to,
                });
            }

            // PROCESS: drain event queue until all packets are delivered

            while (deliveredCount < totalPackets) {
                const event = eventQueue.dequeue();
                if (event == null) {
                    break;
                }

                timeline.push({
                    t: event.t,
                    type: 'arrive',
                    linkId: event._linkId,
                    packetId: event._packetId,
                    fromNode: event._fromNode,
                    toNode: event._toNode,
                });

                const nextHopIndex = event._hopIndex + 1;
                const isLastHop = (nextHopIndex >= event._path.length);

                if (isLastHop) {
                    deliveredCount++;
                    if (event.t > latestDeliveryTime) {
                        latestDeliveryTime = event.t;
                    }
                    continue;
                }

                // If we get here, packet has more hops to traverse.

                const nextHop = event._path[nextHopIndex];
                const hopResult = Simulator._processHop(
                    nextHop.from,
                    nextHop.to,
                    event._sizeBytes,
                    event.t,
                    linkLookup,
                );

                timeline.push({
                    t: hopResult.transmitStart,
                    type: 'send',
                    linkId: hopResult.linkId,
                    packetId: event._packetId,
                    fromNode: nextHop.from,
                    toNode: nextHop.to,
                });

                eventQueue.enqueue({
                    t: hopResult.arriveTime,
                    _packetId: event._packetId,
                    _path: event._path,
                    _hopIndex: nextHopIndex,
                    _sizeBytes: event._sizeBytes,
                    _linkId: hopResult.linkId,
                    _fromNode: nextHop.from,
                    _toNode: nextHop.to,
                });
            }

            return latestDeliveryTime;
        }

        static _processHop(fromNode, toNode, sizeBytes, earliestStart, linkLookup) {
            const endpointKey = fromNode + '-' + toNode;
            const linkInfo = linkLookup[endpointKey];
            const link = linkInfo.link;
            const linkId = linkInfo.linkId;

            const directionKey = (fromNode == link.from) ? 'fwd' : 'rev';
            const dirState = linkInfo.state[directionKey];

            const transmitStart = Math.max(earliestStart, dirState.busyUntil);
            const transmissionDelay = sizeBytes / link.bandwidth;
            const transmitEnd = transmitStart + transmissionDelay;
            const arriveTime = transmitEnd + link.latency;

            dirState.busyUntil = transmitEnd;
            dirState.totalBusyTime += transmissionDelay;

            return { transmitStart, arriveTime, linkId };
        }

        static _precomputeAllPairsBfs(graph) {
            const allPairsBfs = {};

            for (let node of graph.nodes) {
                allPairsBfs[node.id] = graph.bfs(node.id);
            }

            return allPairsBfs;
        }

        static _reconstructPath(predecessors, source, destination) {
            if (source == destination) {
                return [];
            }

            const path = [];
            let current = destination;

            while (current != source) {
                const prev = predecessors[current];
                if (prev == null) {
                    throw new Error(`No path from ${source} to ${destination}`);
                }
                path.push({ from: prev, to: current });
                current = prev;
            }

            path.reverse();
            return path;
        }

        static _buildLinkLookup(graph) {
            const lookup = {};

            for (let i = 0; i < graph.links.length; i++) {
                const link = graph.links[i];
                const linkId = i;

                const linkInfo = {
                    link,
                    linkId,
                    state: {
                        fwd: { busyUntil: 0, totalBusyTime: 0 },
                        rev: { busyUntil: 0, totalBusyTime: 0 },
                    },
                };

                const keyAB = link.from + '-' + link.to;
                const keyBA = link.to + '-' + link.from;
                lookup[keyAB] = linkInfo;
                lookup[keyBA] = linkInfo;
            }

            return lookup;
        }

        static _groupByPhase(schedule) {
            const sendsByPhase = {};

            for (let send of schedule) {
                let phaseSends = sendsByPhase[send.phase];
                if (!phaseSends) {
                    phaseSends = [];
                    sendsByPhase[send.phase] = phaseSends;
                }
                phaseSends.push(send);
            }

            return sendsByPhase;
        }

        static _calcLinkUtilizations(linkLookup, completionTime) {
            if (completionTime == 0) {
                return {};
            }

            const linkUtilizations = {};
            const seen = {};

            for (let key of Object.keys(linkLookup)) {
                const linkInfo = linkLookup[key];
                const linkId = linkInfo.linkId;

                if (seen[linkId]) {
                    continue;
                }
                seen[linkId] = true;

                const fwdBusy = linkInfo.state.fwd.totalBusyTime;
                const revBusy = linkInfo.state.rev.totalBusyTime;
                const totalBusy = fwdBusy + revBusy;
                linkUtilizations[linkId] = totalBusy / completionTime;
            }

            return linkUtilizations;
        }

        static _compareByTime(a, b) {
            return a.t - b.t;
        }

        static _compareNumbers(a, b) {
            return a - b;
        }

    }

    window.DCN.engine.Simulator = Simulator;

})();
