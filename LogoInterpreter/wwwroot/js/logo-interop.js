let logoInterpreter;
let turtle;
let canvas;
let ctx;

// Main logo interop object
window.logoInterop = {
    initializeLogo: function () {
        try {
            // Initialize the canvas
            canvas = document.getElementById('sandbox');
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }

            // Initialize Logo interpreter
            logoInterpreter = new LogoInterpreter();
            turtle = new CanvasTurtle(canvas);

            // Set up the Logo environment
            logoInterpreter.setTurtle(turtle);

            // Clear the canvas initially
            this.clearCanvas();

            console.log('Logo interpreter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Logo interpreter:', error);
            throw error;
        }
    },

    executeCommand: function (command) {
        try {
            if (!logoInterpreter) {
                throw new Error('Logo interpreter not initialized');
            }
            return logoInterpreter.run(command);
        } catch (error) {
            console.error('Command execution error:', error);
            throw new Error(error.message || 'Unknown execution error');
        }
    },

    clearCanvas: function () {
        try {
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            if (turtle) {
                turtle.reset();
            }
        } catch (error) {
            console.error('Canvas clear error:', error);
            throw error;
        }
    }
};

// Enhanced Logo Interpreter
class LogoInterpreter {
    constructor() {
        this.procedures = new Map();
        this.variables = new Map();
        this.turtle = null;
        this.stack = [];
        this.repeatCount = 0;
    }

    setTurtle(turtle) {
        this.turtle = turtle;
    }

    run(code) {
        if (!code || code.trim().length === 0) {
            return '';
        }

        const lines = code.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith(';')); // Filter comments

        let output = '';

        for (const line of lines) {
            try {
                const result = this.executeLine(line);
                if (result && result.trim().length > 0) {
                    output += result + '\n';
                }
            } catch (error) {
                throw new Error(`Error in "${line}": ${error.message}`);
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
            // Movement commands
            case 'fd':
            case 'forward':
                return this.executeForward(args);
            case 'bk':
            case 'backward':
                return this.executeBackward(args);
            case 'rt':
            case 'right':
                return this.executeRight(args);
            case 'lt':
            case 'left':
                return this.executeLeft(args);

            // Pen commands
            case 'pu':
            case 'penup':
                this.turtle.penUp();
                break;
            case 'pd':
            case 'pendown':
                this.turtle.penDown();
                break;

            // Color and style
            case 'setcolor':
            case 'setpencolor':
                return this.executeSetColor(args);
            case 'setpensize':
                return this.executeSetPenSize(args);

            // Control structures
            case 'repeat':
                return this.executeRepeat(args);

            // Procedure definition
            case 'to':
                return this.defineProcedure(args);
            case 'end':
                return ''; // End of procedure definition

            // Variables
            case 'make':
                return this.executeVarAssignment(args);

            // Utility commands
            case 'home':
                this.turtle.home();
                break;
            case 'clean':
                this.turtle.clean();
                break;
            case 'clearscreen':
            case 'cs':
                this.turtle.clearScreen();
                break;

            // Output commands
            case 'print':
            case 'pr':
                return this.executePrint(args);

            // Special variables
            case 'repcount':
                return this.repeatCount.toString();

            default:
                // Check if it's a user-defined procedure
                if (this.procedures.has(command)) {
                    return this.executeProcedure(command, args);
                } else {
                    throw new Error(`Unknown command: ${command}`);
                }
        }

        return '';
    }

    tokenize(line) {
        // Handle brackets and quotes properly
        const tokens = [];
        let current = '';
        let inQuotes = false;
        let inBrackets = 0;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"' && !inQuotes) {
                inQuotes = true;
                current += char;
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
                current += char;
            } else if (char === '[' && !inQuotes) {
                inBrackets++;
                current += char;
            } else if (char === ']' && !inQuotes) {
                inBrackets--;
                current += char;
            } else if (char === ' ' && !inQuotes && inBrackets === 0) {
                if (current.trim().length > 0) {
                    tokens.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.trim().length > 0) {
            tokens.push(current.trim());
        }

        return tokens;
    }

    executeForward(args) {
        if (args.length === 0) throw new Error('FORWARD requires a distance');
        const distance = this.evaluateExpression(args[0]);
        this.turtle.forward(distance);
        return '';
    }

    executeBackward(args) {
        if (args.length === 0) throw new Error('BACKWARD requires a distance');
        const distance = this.evaluateExpression(args[0]);
        this.turtle.backward(distance);
        return '';
    }

    executeRight(args) {
        if (args.length === 0) throw new Error('RIGHT requires an angle');
        const angle = this.evaluateExpression(args[0]);
        this.turtle.right(angle);
        return '';
    }

    executeLeft(args) {
        if (args.length === 0) throw new Error('LEFT requires an angle');
        const angle = this.evaluateExpression(args[0]);
        this.turtle.left(angle);
        return '';
    }

    executeSetColor(args) {
        if (args.length === 0) throw new Error('SETCOLOR requires a color');
        const color = args[0].replace(/['"]/g, ''); // Remove quotes
        this.turtle.setColor(color);
        return '';
    }

    executeSetPenSize(args) {
        if (args.length === 0) throw new Error('SETPENSIZE requires a size');
        const size = this.evaluateExpression(args[0]);
        this.turtle.setPenSize(size);
        return '';
    }

    executeRepeat(args) {
        if (args.length < 2) throw new Error('REPEAT requires count and commands');

        const count = this.evaluateExpression(args[0]);
        const commands = args.slice(1).join(' ');

        // Remove brackets if present
        const cleanCommands = commands.replace(/^\[|\]$/g, '').trim();

        for (let i = 1; i <= count; i++) {
            this.repeatCount = i;
            this.executeLine(cleanCommands);
        }
        this.repeatCount = 0;
        return '';
    }

    executeVarAssignment(args) {
        if (args.length < 2) throw new Error('MAKE requires variable name and value');
        const varName = args[0].replace(/^[":]/, ''); // Remove quotes or colon
        const value = this.evaluateExpression(args[1]);
        this.variables.set(varName, value);
        return '';
    }

    executePrint(args) {
        if (args.length === 0) return '';
        const value = this.evaluateExpression(args.join(' '));
        return String(value);
    }

    evaluateExpression(expr) {
        // Handle special keywords
        if (expr.toLowerCase() === 'repcount') {
            return this.repeatCount;
        }

        // Handle variables (starting with :)
        if (expr.startsWith(':')) {
            const varName = expr.substring(1);
            if (this.variables.has(varName)) {
                return this.variables.get(varName);
            }
            throw new Error(`Variable ${varName} not defined`);
        }

        // Handle quoted strings
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.slice(1, -1);
        }

        // Handle numbers
        if (!isNaN(expr)) {
            return parseFloat(expr);
        }

        // Handle simple math expressions
        try {
            // Simple arithmetic operations only
            if (/^[\d+\-*/(). ]+$/.test(expr)) {
                return eval(expr);
            }
        } catch {
            // Fall through to return as string
        }

        return expr; // Return as string if can't evaluate
    }

    defineProcedure(args) {
        if (args.length === 0) throw new Error('TO requires procedure name');
        const name = args[0].toLowerCase();
        const params = args.slice(1);
        this.procedures.set(name, { params, commands: [] });
        return `Procedure ${name} defined`;
    }

    executeProcedure(name, args) {
        const procedure = this.procedures.get(name);
        if (!procedure) throw new Error(`Procedure ${name} not found`);

        // Simple procedure execution (commands would be stored during definition)
        return `Executing procedure: ${name}`;
    }
}

// Enhanced Turtle Graphics
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
        this.penSize = 1;

        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.penSize;
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
        // Handle common color names
        const colorMap = {
            'red': '#FF0000',
            'green': '#00FF00',
            'blue': '#0000FF',
            'yellow': '#FFFF00',
            'orange': '#FFA500',
            'purple': '#800080',
            'violet': '#800080',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'grey': '#808080'
        };

        this.color = colorMap[color.toLowerCase()] || color;
        this.ctx.strokeStyle = this.color;
    }

    setPenSize(size) {
        this.penSize = Math.max(1, size);
        this.ctx.lineWidth = this.penSize;
    }

    home() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.angle = 0;
    }

    clean() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearScreen() {
        this.clean();
        this.home();
    }
}

// Helper function for scrolling
window.scrollToBottom = function (elementId) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    } catch (error) {
        console.warn('Could not scroll element:', error);
    }
};