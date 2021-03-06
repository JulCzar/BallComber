
import { getIncrements } from './utils/getIncrementsByDirection.js'
import { doAfter } from './utils/wait.js'

export const createRenderEngine = ({
  renderInterface,
  animatedInterface,
  width = 4,
  height = 4,
  gridSize,
  animationDuration = 250
}) => {
  if (!animatedInterface) throw new Error('target interface of animation engine not declared')
  const renderObject = document.querySelector(renderInterface)
  const knownAnimations = ['movement_down', 'movement_up','movement_left','movement_right']
  const observers = []
  
  const generateFallingAnimations = () => {
    const dropCss = []

    for (let i=height; i>0; i--) {
      dropCss.push(`@keyframes falling-${i}-blocks { 0% { transform: translateY(-${i*gridSize}px) }; 100% {} }`)
      dropCss.push(`.fall-${i}-blocks, .fall-${i}-blocks.movement-up, .fall-${i}-blocks.movement-down, .fall-${i}-blocks.movement-left, .fall-${i}-blocks.movement-right { animation: falling-${i}-blocks; animation-duration: calc(var(--animationDuration)/2); }`)
      knownAnimations.push(`fall-${i}-blocks`)
    }

    return dropCss.join('')
  }

  const start = () => {
    console.log('animation engine started')

    const style = document.createElement('style')
    style.innerText += `body { --animationDuration: ${animationDuration*2}ms; --gridSize: ${gridSize}px; --gridWidth: ${width}; --gridHeight: ${height} } #block { z-index: 9999;cursor: not-allowed;width: 100%;height: 100%;position: absolute; }`
    style.innerText += generateFallingAnimations()
    document.head.append(style)
    
  }

  const subscribe = observer => {
    observers.push(observer)
    
    console.log(`${observers.length} observers subscribed to execute at animation end`)
  }

  /**
   * @param {HTMLElement} target 
   * @param {'up' | 'down' | 'left' | 'right'} direction 
   */
  const notifyAll = (direction, target) => {
    console.log(`notifying ${observers.length} observers about an animation start`)

    observers.forEach(observer => observer(direction, target))
  }

  

  /**
   * 
   * @param {'up' | 'down' | 'left' | 'right'} direction 
   */
  const getOppositeDirection = direction => ({
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
  }[direction])

  /**
   * @param {HTMLElement} target 
   * @param {'up' | 'down' | 'left' | 'right'} direction 
   */
  const fireAnimation = (target, direction) => {
    const { xIncrement , yIncrement } = getIncrements(direction)
    const row = Number(target.attributes.row.value)
    const col = Number(target.attributes.col.value)

    target.classList.add(`movement_${direction}`)

    for (const gem of document.querySelectorAll(animatedInterface)) {
      const oppositeDirection = getOppositeDirection(direction)
      const gemRow = Number(gem.attributes.row.value)
      const gemCol = Number(gem.attributes.col.value)

      if (gemRow == (row + yIncrement) && gemCol == (col + xIncrement))
        gem.classList.add(`movement_${oppositeDirection}`)
    }
  }

  const clearAllAnimations = () => {
    const itemsToAnimate = document.querySelectorAll(animatedInterface)
    for (const item of itemsToAnimate) {
      knownAnimations.forEach(anim => item.classList.remove(anim))
    }
  }

  /**
   * @param {'up' | 'down' | 'left' | 'right'} direction 
   * @param {HTMLElement} target
   */
  const triggerSwapAnimation = (direction, target) => {
    const isMovingOutsideGrid = () => {
      const row = Number(target.attributes.row.value)
      const col = Number(target.attributes.col.value)

      const isMovingFirstRowUp = row===0 && direction === 'up'
      const isMovingLastRowDown = row===height-1 && direction === 'down'
      const isMovingFirstColumnLeft = col===0 && direction === 'left'
      const isMovingLastColRight = col===height-1 && direction === 'right'

      return isMovingFirstRowUp || isMovingLastRowDown || isMovingFirstColumnLeft || isMovingLastColRight
    }

    if (isMovingOutsideGrid()) return

    notifyAll(direction, target)

    fireAnimation(target, direction)

    doAfter(clearAllAnimations, animationDuration*2)
  }
  
  /**
   * @param {number[][]} gameGrid 
   */
  const render = (gameGrid, changes) => {
    const getColor = value => ['teal', 'red', '#666654', 'pink', 'purple'][value]

    const gameGridHTML = ['<div class="table">']
    
    for (let y=0; y<height; y++) {
      gameGridHTML.push('<div class="row">')
      
      for (let x=0; x<width; x++) {
        const value = gameGrid[y][x]
        const fall = changes[y][x]?`fall-${changes[y][x]}-blocks`:''
        gameGridHTML.push(`<div row="${y}" col="${x}"  draggable="false" class="gem far ${fall}">
          <div row="${y}" col="${x}" style="background-color: ${getColor(value)}"}></div>
        </div>`)
      }

      gameGridHTML.push('</div>')
    }
    gameGridHTML.push('</div>')

    renderObject.innerHTML = gameGridHTML.join('')

    doAfter(clearAllAnimations, animationDuration*2)
  }

  start()

  return {
    render,
    triggerSwapAnimation,
    subscribe
  }
}