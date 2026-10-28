# Circuit basics — simulate, build, and measure

[Open the tutorial in EWorkbench](https://jmbjr.github.io/lab/eworkbench/?project=circuit-basics&schematic=voltage-divider).

This is TODO-002: a separate learning project with three designed teaching circuits. The microphone's observed connectivity remains in its own project. No physical readings have been recorded for this tutorial.

## What you will do

1. **Predict:** calculate an expected result and write it down before revealing the answers.
2. **Simulate:** run the matching CircuitJS1 model, inspect the probes/components, and change one value.
3. **Build:** wire a separate breadboard circuit with the supply disconnected.
4. **Measure:** record actual values, probe endpoints, power state, units, and uncertainties; explain differences from the model.

The website contains the complete lesson instructions in its tutorial panel. Previous/Next and the Schematic selector switch lessons together with the models. Answers and troubleshooting are expandable. Parts/setup guidance is available in every lesson. Starting CircuitJS1 files can be downloaded without waiting for the simulator; edited files can be exported after it loads.

## Materials

- Breadboard, jumper wires, multimeter, timer, and a switched two-AA holder (about 3 V).
- Three 1 kΩ resistors; two 10 kΩ resistors (one for timing and one for initial capacitor discharge). Ordinary ¼ W parts are sufficient.
- One 1000 µF electrolytic capacitor rated at least 6.3 V. Verify polarity from its markings.
- Optional 2 kΩ and additional 10 kΩ resistors for divider variations. Simulations can be completed before parts are available; physical milestones remain pending.

Use COM and V/Ω sockets for these exercises. Current is inferred from voltage and resistance, so no current-mode measurements are required. Disconnect power before rewiring. Resistance/continuity measurements require an unpowered, discharged circuit. Build separately from the microphone and M45; the two-AA setup avoids involving their batteries and electronics.

## Lessons and ideal reference values

These are model predictions, not measured results. Use the actual supply voltage and separately measured resistor values when comparing your build.

| Lesson | Starting circuit | Ideal prediction |
| --- | --- | --- |
| 1 · Voltage divider | 3.0 V; R1 = R2 = 1 kΩ | VOUT = 1.5 V; series current = 1.5 mA |
| 2 · Loading | Same divider; RL = 1 kΩ across R2 | VOUT = 1.0 V; top current = 2 mA; each lower branch = 1 mA |
| 3 · RC timing | 10 kΩ; 1000 µF; 0 → 3 V input step | τ = 10 s; VC ≈ 1.90 V at 10 s, 2.85 V at 30 s, 2.98 V at 50 s |

Lesson 3's simulator uses a 0–3 V, 0.005 Hz square wave (100 simulated seconds high, 100 low), with initial capacitor voltage zero. The physical build uses a manual input change. To discharge, first remove the resistor input wire from battery +, then connect it to GND: the capacitor discharges through the timing resistor. Do not short the supply. The simulator's generic capacitor does not enforce electrolytic polarity, model leakage, or guarantee real capacitor timing.

Capacitor tolerance, leakage, meter input resistance, and sampling delay can change measured results. If you substitute R or C, recalculate τ = R × C and adjust measurement times. The introductory RC circuit is a low-pass example; it does not establish a microphone coupling circuit or component values.

## Record and share results

Each lesson has its own browser-local Field notes draft. Use:

```text
Lesson:
Parts and actual values:
Predicted:
Simulated (including edits):
Measured (node pair, reference, meter mode, power state, elapsed time, units):
Differences and possible explanations:
Open questions / missing parts:
```

Click **Copy update for ChatGPT** and paste the update into chat. The handoff contains the lesson and recorded roadmap context. Browsing does not change the repository or complete a lesson. Review measurements through a PR before updating roadmap status; simulation alone does not satisfy physical measurement criteria.

## Sources of truth

- [Project and complete lesson content](project.json)
- [Roadmap and completion criteria](../../../projects/todo/TODO-002/todo.json)
- Starting models: [divider](voltage-divider.txt), [loaded divider](loaded-divider.txt), [RC](rc-charge.txt)
- [CircuitJS1 upstream divider example](https://github.com/pfalstad/circuitjs1/blob/master/ts/public/circuits/voltdivide.txt) and [voltage-source implementation](https://github.com/pfalstad/circuitjs1/blob/master/ts/VoltageElm.ts) for file-format reference.

## PROJECT SOURCE CANDIDATE

Teaching circuits should preserve a four-part evidence loop: prediction → ideal simulation → separate physical build → measured comparison. Author-provided component values and answers remain design assumptions until measured. Lesson progress and missing physical work are recorded in the roadmap, independently of browser navigation.
