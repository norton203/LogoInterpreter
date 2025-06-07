let logoInterpreter;
let turtle;
let canvas;
let ctx;

window.logoInterop = {
    initializeLogo: function () {
        // Initialize the canvas
        canvas = document.getElementById('sandbox');
        ctx = canvas.getContext('2d');

        // Initialize Logo interpreter (simplified version)
        logoInterpreter = new LogoInterpreter();
        turtle = new CanvasTurtle(canvas);

        // Set up the Logo environment
        logoInterpreter.setTurtle(turtle);

        // Clear the canvas initially
        this.clearCanvas();
    },

    executeCommand: function (command) {
        try {
            return logoInterpreter.run(command);
        } catch (error) {
            throw new Error(error.message);
        }
    },

    clearCanvas: function () {
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (turtle) {
            turtle.reset();
        }
    }
};

// Simplified Logo Interpreter
class LogoInterpreter {
    constructor() {
        this.procedures = new Map();
        this.variables = new Map();
        this.turtle = null;
    }

    setTurtle(turtle) {
        this.turtle = turtle;
    }

    run(code) {
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let output = '';

        for (const line of lines) {
            try {
                const result = this.executeLine(line);
                if (result) {
                    output += result + '\n';
                }
            } catch (error) {
                throw new Error(`Error in line "${line}": ${error.message}`);
            }
        }

        return output.trim();
    }

    executeLine(line) {
        const tokens = this.tokenize(line);
        if (tokens.length === 0) return '';

        const command = tokens[0].toLowerCase();
        const args = tokens.slice(1);

        switch (command) {
            case 'fd':
            case 'forward':
                if (args.length > 0) {
                    this.turtle.forward(parseFloat(args[0]));
                }
                break;
            case 'bk':
            case 'backward':
                if (args.length > 0) {
                    this.turtle.backward(parseFloat(args[0]));
                }
                break;
            case 'rt':
            case 'right':
                if (args.length > 0) {
                    this.turtle.right(parseFloat(args[0]));
                }
                break;
            case 'lt':
            case 'left':
                if (args.length > 0) {
                    this.turtle.left(parseFloat(args[0]));
                }
                break;
            case 'pu':
            case 'penup':
                this.turtle.penUp();
                break;
            case 'pd':
            case 'pendown':
                this.turtle.penDown();
                break;
            case 'setcolor':
                if (args.length > 0) {
                    this.turtle.setColor(args[0]);
                }
                break;
            case 'repeat':
                if (args.length >= 2) {
                    const count = parseInt(args[0]);
                    const commands = args.slice(1).join(' ');
                    return this.executeRepeat(count, commands);
                }
                break;
            case 'to':
                return this.defineProcedure(args);
            case 'end':
                // Handle end of procedure definition
                break;
            default:
                // Check if it's a user-defined procedure
                if (this.procedures.has(command)) {
                    return this.executeProcedure(command, args);
                } else {
                    return `Unknown command: ${command}`;
                }
        }

        return '';
    }

    tokenize(line) {
        return line.match(/\S+/g) || [];
    }

    executeRepeat(count, commands) {
        // Simple repeat implementation
        const cleanCommands = commands.replace(/^\[|\]$/g, '').trim();
        for (let i = 0; i < count; i++) {
            this.executeLine(cleanCommands);
        }
        return '';
    }

    defineProcedure(args) {
        if (args.length > 0) {
            const name = args[0].toLowerCase();
            this.procedures.set(name, args.slice(1));
            return `Procedure ${name} defined`;
        }
        return '';
    }

    executeProcedure(name, args) {
        const procedure = this.procedures.get(name);
        if (procedure) {
            const commands = procedure.join(' ');
            return this.executeLine(commands);
        }
        return '';
    }
}

// Simplified Turtle Graphics
class CanvasTurtle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = 0; // 0 degrees is pointing up
        this.penIsDown = true;
        this.color = 'black';
        this.lineWidth = 1;

        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    forward(distance) {
        const radians = (this.angle - 90) * Math.PI / 180;
        const newX = this.x + distance * Math.cos(radians);
        const newY = this.y + distance * Math.sin(radians);

        if (this.penIsDown) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.x, this.y);
            this.ctx.lineTo(newX, newY);
            this.ctx.stroke();
        }

        this.x = newX;
        this.y = newY;
    }

    backward(distance) {
        this.forward(-distance);
    }

    right(degrees) {
        this.angle += degrees;
        this.angle = this.angle % 360;
    }

    left(degrees) {
        this.angle -= degrees;
        this.angle = this.angle % 360;
    }

    penUp() {
        this.penIsDown = false;
    }

    penDown() {
        this.penIsDown = true;
    }

    setColor(color) {
        this.color = color;
        this.ctx.strokeStyle = this.color;
    }
}

// Helper function for scrolling
window.scrollToBottom = function (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
};
