import React, { useState, useRef, useEffect } from 'react';
import { Calculator as CalculatorIcon, X, Move } from 'lucide-react';

const Calculator = ({ isOpen, onClose, isDraggable = false }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef(null);

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    
    setIsDragging(true);
    const rect = calculatorRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isDraggable) return;
    
    const container = calculatorRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const calculatorRect = calculatorRef.current.getBoundingClientRect();
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Boundary constraints
    const maxX = containerRect.width - calculatorRect.width;
    const maxY = containerRect.height - calculatorRect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  if (!isOpen) return null;

  if (isDraggable) {
    // Draggable version for use within tabs
    return (
      <div 
        ref={calculatorRef}
        className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 border border-gray-200 dark:border-gray-700 z-50"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-gray-400" />
            <CalculatorIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Calculator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          {/* Display */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
            <div className="text-right text-xl font-mono text-gray-900 dark:text-white overflow-hidden">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={clear}
              className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => performOperation('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              ÷
            </button>
            <button
              onClick={() => performOperation('*')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              ×
            </button>

            {[7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(num)}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 text-sm rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => performOperation('-')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              -
            </button>

            {[4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(num)}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 text-sm rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => performOperation('+')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              +
            </button>

            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(num)}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 text-sm rounded-md transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleEquals}
              className="row-span-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-md transition-colors"
            >
              =
            </button>

            <button
              onClick={() => inputNumber(0)}
              className="col-span-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 text-sm rounded-md transition-colors"
            >
              .
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal version (existing implementation)
  return (
        <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CalculatorIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calculator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Display */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="text-right text-2xl font-mono text-gray-900 dark:text-white overflow-hidden">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={clear}
              className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => performOperation('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              ÷
            </button>
            <button
              onClick={() => performOperation('*')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              ×
            </button>

            <button
              onClick={() => inputNumber(7)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              7
            </button>
            <button
              onClick={() => inputNumber(8)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              8
            </button>
            <button
              onClick={() => inputNumber(9)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              9
            </button>
            <button
              onClick={() => performOperation('-')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              -
            </button>

            <button
              onClick={() => inputNumber(4)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              4
            </button>
            <button
              onClick={() => inputNumber(5)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              5
            </button>
            <button
              onClick={() => inputNumber(6)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              6
            </button>
            <button
              onClick={() => performOperation('+')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              +
            </button>

            <button
              onClick={() => inputNumber(1)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              1
            </button>
            <button
              onClick={() => inputNumber(2)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              2
            </button>
            <button
              onClick={() => inputNumber(3)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              3
            </button>
            <button
              onClick={handleEquals}
              className="row-span-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              =
            </button>

            <button
              onClick={() => inputNumber(0)}
              className="col-span-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
            >
              .
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;