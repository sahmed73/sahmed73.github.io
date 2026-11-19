import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../assets/nox-pet.js", import.meta.url), "utf8");

function playground() {
  let focused = null;
  let now = 0;
  let nextId = 0;
  const frames = new Map();
  const timers = new Map();
  class Element {
    listeners = new Map();
    style = {};
    textContent = "";
    open = false;
    dataset = {sprites: "/assets/pets/nox-sprites.webp"};
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    fire(type) { this.listeners.get(type)?.(); }
    focus() { focused = this; }
    showModal() { this.open = true; }
    close() { this.open = false; this.fire("close"); }
  }
  const ids = Object.fromEntries(["open", "dialog", "pet", "sprite", "message", "count", "close"].map(id => [id, new Element()]));
  const motion = new Element();
  motion.matches = false;
  let image;
  class Image extends Element { constructor() { super(); this.src = ""; image = this; } }
  vm.runInNewContext(code, {
    document: {getElementById: id => ids[id.replace("nox-", "")]},
    window: {matchMedia: () => motion}, Image,
    performance: {now: () => now},
    requestAnimationFrame: fn => { const id = ++nextId; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, delay) => { const id = ++nextId; timers.set(id, {fn, due: now + delay}); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    ids, image, motion, frames, timers,
    focus: () => focused,
    click: id => ids[id].fire("click"),
    frame(time) {
      now = time;
      const work = [...frames.values()]; frames.clear();
      work.forEach(fn => fn(time));
    },
    advance(time) {
      now = time;
      for (const [id, task] of timers) if (task.due <= time) { timers.delete(id); task.fn(); }
    },
  };
}

const ui = playground();
assert.equal(ui.frames.size, 0, "Closed Nox must not animate in the background");
assert.equal(ui.image.src, "", "Load the large sprite sheet only when opened");
ui.click("open");
assert.equal(ui.ids.dialog.open, true);
assert.equal(ui.ids.message.textContent, "Pet me, please!");
assert.equal(ui.focus(), ui.ids.pet, "Keyboard users can pet Nox immediately");
assert.equal(ui.image.src, "/assets/pets/nox-sprites.webp");
ui.click("pet");
assert.match(ui.ids.count.textContent, /^1 head scratch\./);
assert.equal(ui.ids.message.textContent, "That's the spot!");
assert.equal(ui.frames.size, 0, "The poster remains usable while artwork loads");
ui.image.fire("load");
ui.frame(320);
assert.equal(ui.ids.sprite.style.backgroundPosition, "-384px -832px");
ui.advance(800);
assert.equal(ui.ids.sprite.style.backgroundPosition, "0px 0px", "Settle back into the idle pose");
ui.advance(6000);
assert.equal(ui.ids.message.textContent, "Pet me, please!");
ui.click("pet"); ui.click("pet");
assert.match(ui.ids.count.textContent, /^3 head scratches\./);
assert.equal(ui.timers.size, 2, "Rapid clicks replace previous reaction timers");
ui.click("close");
assert.equal(ui.ids.dialog.open, false);
assert.equal(ui.frames.size, 0);
assert.equal(ui.timers.size, 0);
assert.equal(ui.focus(), ui.ids.open, "Closing returns focus to the launcher");
ui.motion.matches = true;
ui.click("open");
assert.equal(ui.ids.message.textContent, "Back for more head scratches?");
assert.equal(ui.frames.size, 0, "Respect reduced-motion preferences");
ui.click("pet");
assert.match(ui.ids.count.textContent, /^4 head scratches\./);
ui.ids.dialog.close();
assert.equal(ui.timers.size, 0, "Native dialog dismissal also cleans up");
console.log("Passed: Nox opening, petting, reactions, lazy artwork, timer cleanup, focus, and reduced motion.");
