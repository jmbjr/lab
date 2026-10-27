# U1: provisional JieLi SoC reference

## Current identification

The board contains a QFN-like black IC bearing the **JieLi / JL logo**, next to a 24.000 MHz crystal. The board silkscreen appears to read **AC7006JM** (interpretation uncertain). Its optical appearance suggests **about five accessible contacts on each edge**, possibly **20 total**; the count and manufacturer pin-1 indicator have **not** been verified.

We **have not confirmed the exact IC suffix or pinout**. `AC7006 family` is a **candidate family**, not a reason to reuse a 32-pin pin assignment.

## Document hierarchy

1. **AC7006D Datasheet V1.1 (2021)**: https://bluetooth.com.cn/images/chips/datasheet/Jieli_AC7006D_Datasheet.pdf
   - The related AC7006D QFN32 IC has analog microphone inputs with mic bias, ADC/DAC audio functions, a crystal oscillator, USB, RF, and GPIO.
   - *Useful for the functional-block vocabulary and what we may wish to probe.*
   - **Unsafe for this board's physical pad numbering**; published AC7006D is 32-pin, visually inconsistent with the photographed U1.
2. **AC7066M Wireless Microphone Transmitter Reference Schematic**:
   https://www.yunthinker.com/static/upload/file/20250603/1748945965636685.pdf
   - Illustrates a genuinely wireless microphone transmitter built around **a different JieLi SoC**, using mic signal and bias circuits, 24 MHz reference, charging, controls, and RF.
   - *Useful for comparing analog mic front ends and identifying probable sections.* Do not copy its pin labels or component values to our board.
3. **JieLi part-number/marking background**: https://github.com/virtualabs/jielie-info
   - Explains why laser top markings can differ from model or internal family names.

These are *reference links*, not redistributions. Follow the published documents' licensing restrictions.

## Our U1 representation

Machine-readable `jl-u1-chip.json` is the device placeholder:

- Refdes: **U1**
- Manufacturer: **JieLi** (logo visibly present)
- Candidate family: **AC7006**, exact model **unknown**
- Estimated package: **20-contact, QFN-like**; visually provisional
- Positional contact names: **T1–T5 / R1–R5 / B1–B5 / L1–L5**
  - These are **positional labels only**, drawn in the photographed top-view orientation.
  - **They are not vendor pin numbers, and do not assert the pin-1 corner.**
  - `manufacturer_pin`, `function`, and `net` remain `null` until each can be justified.

The only continuity-verified U1 contact so far is the **JL-A** alias, connected to `C1R.2` via `NET_C1R_OUT`. Its exact position on the 20-contact drawing has not been recorded. It must not be drawn as connected to a specific numbered pad.

## Functional blocks we may expect (but cannot assign to pins)

- Analog microphone/bias/ADC functionality
- 24 MHz crystal oscillator
- 2.4 GHz radio / antenna
- GPIO for buttons and status
- USB / battery / power regulation
- Possibly accessible DAC/audio output

The first group is informed by **related-device datasheets and this board's observed components**, not direct measurement of the target IC. Existence of a *specific exposed DAC pin* is **not proven**.

## Useful next physical observation (unpowered)

With battery disconnected, inspect which **physical side and contact** of U1 is the previously traced `JL-A` connected to. Record e.g. `R3` only after verifying the drawing orientation against the real board. Repeat for any contact proven connected to a crystal or the C1L path. Do not run powered tests on unknown pins based solely on a different package's datasheet.

Then update `jl-u1-chip.json` and its drawing. Avoid inserting fictional connections in the CircuitJS1 simulation.
