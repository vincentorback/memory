/* global Modernizr, interact */

(function (window) {
  'use strict'

  if (!Modernizr.svg) {
    window.alert('OMG NOOOOO! Your browser is to old (or maybe just super unique) and can’t play the game... :/')
    return
  }

  function getSavedScore () {
    return Modernizr.localstorage ? window.localStorage.getItem('memory_score') : 0
  }

  function nodesToArray (nodes) {
    return [].slice.call(nodes)
  }

  var doc = window.document
  var html = doc.documentElement
  var game = doc.querySelector('#game')
  var demo = game.querySelector('#demo')
  var finger = game.querySelector('#finger')
  var connectors = game.querySelectorAll('.js-connector')
  var tracer = game.querySelector('#tracer')
  var scoreEl = doc.querySelector('#streak')
  var modalElement = doc.querySelector('#modal')
  var modalText = modalElement.querySelector('#modal-text')
  var streak = parseFloat(getSavedScore()) || 0
  var strokeSpeed = 10
  var disabled = true
  var originalSize = 600
  var gameSize = game.getBoundingClientRect()
  var gameScale = (gameSize.width > originalSize) ? (originalSize / gameSize.height) : (originalSize / gameSize.width)
  var colors = {
    text: '#0F1D20',
    inactiveCircle: '#EFD176',
    activeCircle: '#fff',
    trail: '#fff',
    startCircle: '#fff'
  }
  var pathCoords = 'M 300,300'
  var lastCoords = {
    'x': 300,
    'y': 300
  }
  var dragTarget
  var dragEndTarget
  var cX
  var cY
  var fingerX
  var fingerY
  var activeClass = 'is-active'
  var rotateClass = 'u-animRotate'
  var scaleClass = 'u-animScale'
  var goalPath
  var firstPath = 'M 300,300 L 300,50 L 517,175 L 517,425 L 300,550 L 83,425 L 83,175'

  function setScore (score) {
    score = (score > 0) ? score : 0

    if (score === 0) {
      streak = 0
    }

    streak += parseFloat(score)

    if (streak !== parseFloat(scoreEl.innerHTML)) {
      scoreEl.innerHTML = streak
    }

    scoreEl.classList.toggle(activeClass, streak > 0)

    if (Modernizr.localstorage) {
      window.localStorage.setItem('memory_score', streak)
    }
  }

  function modal (text, timeout, action, args) {
    if (text) {
      modalElement.classList.add(activeClass)
      modalText.innerHTML = text
    }

    if (timeout || action) {
      if (text) {
        window.setTimeout(function () {
          modalElement.classList.remove(activeClass)
        }, Math.min(2000, timeout - 100))
      }

      window.setTimeout(function () {
        action(args)
      }, Math.min(2000, timeout))
    }
  }

  var pointsArray
  var d = 'M 300,300 L '
  var dashoffset
  var demoPathLength

  function createDemoPath () {
    disabled = true
    game.classList.remove(activeClass)

    dashoffset = 0

    d = 'M 300,300 L '
    pointsArray = []

    finger.setAttribute('fill', colors.startCircle)
    tracer.setAttribute('d', '')
    tracer.setAttribute('style', 'opacity: 1')

    nodesToArray(connectors).forEach(function (connector, i) {
      if ((connectors.length - 1) > i) {
        connector.setAttribute('fill', colors.inactiveCircle)
        pointsArray[Math.random() > 0.5 ? 'push' : 'unshift']([parseFloat(connector.getAttribute('cx')), parseFloat(connector.getAttribute('cy'))])
      }
    })

    d += pointsArray.join(' L ')

    if (streak === 0) {
      d = firstPath
    }

    demo.setAttribute('d', d)

    demoPathLength = demo.getTotalLength()
    demo.setAttribute('stroke-dasharray', demoPathLength)
    demo.setAttribute('stroke-dashoffset', demoPathLength)

    var doDraw = function () {
      dashoffset += Math.min((strokeSpeed * (streak === 0 ? 1 : streak)), 40)

      if (dashoffset < demoPathLength) {
        demo.setAttribute('stroke-dashoffset', demoPathLength - dashoffset)
        window.requestAnimationFrame(doDraw)
      } else {
        demo.setAttribute('stroke-dashoffset', 0)

        if (streak < 1) {
          getTracePath(d)
          game.classList.remove(rotateClass, scaleClass)
          disabled = false
          game.classList.add(activeClass)

          modal('Drag along your <i>memory</i>...', 6000, function () {
            demo.setAttribute('d', '')
          })
        } else {
          getTracePath(d)
          game.classList.remove(rotateClass, scaleClass)
          disabled = false
          game.classList.add(activeClass)

          window.setTimeout(function () {
            demo.setAttribute('d', '')
          }, 1500)
        }
      }
    }

    doDraw()
  }

  function dragMoveListener (event) {
    if (disabled) {
      return
    }

    dragTarget = event.target

    fingerX = parseFloat(dragTarget.getAttribute('cx')) + (gameScale * event.dx)
    fingerY = parseFloat(dragTarget.getAttribute('cy')) + (gameScale * event.dy)

    dragTarget.setAttribute('cx', fingerX)
    dragTarget.setAttribute('cy', fingerY)

    nodesToArray(connectors).forEach(function (connector) {
      cX = parseFloat(connector.getAttribute('cx'))
      cY = parseFloat(connector.getAttribute('cy'))
      if ((cX - 50) <= fingerX && fingerX <= (cX + 50) && (cY - 50) <= fingerY && fingerY <= (cY + 50)) {
        if (pathCoords.indexOf(cX + ',' + cY) < 0) {
          pathCoords += (' L ' + cX + ',' + cY)
          lastCoords.x = cX
          lastCoords.y = cY
        }
        connector.setAttribute('fill', colors.activeCircle)
      }
    })

    tracer.setAttribute('d', pathCoords + ' L ' + fingerX + ', ' + fingerY)
  }

  function dragEndListener (event) {
    disabled = true
    game.classList.remove(activeClass)

    dragEndTarget = event.target
    tracer.setAttribute('style', 'opacity: 0')
    dragEndTarget.setAttribute('cx', 300)
    dragEndTarget.setAttribute('cy', 300)
    tracer.setAttribute('d', pathCoords)

    if (goalPath === pathCoords) {
      setScore(1)

      if (streak > 40) {
        modal('You win...<br>I’m sorry, no more games...<br><a href="https://unicef.se/ge-pengar">Go do... something!</a>')
        modalElement.style.cssText = 'z-index:100;pointer-events:auto'
      } else if (streak > 25) {
        modal(streak + ' <i>memory</i> streak!', 6000, createDemoPath)
      } else if (streak > 30) {
        modal('Whatheee?', 6000, createDemoPath)
      } else if (streak > 25) {
        modal(streak + ' <i>memory</i> streak!', 6000, createDemoPath)
      } else if (streak > 24) {
        modal('Get out of here...', 6000, createDemoPath)
        game.classList.add(rotateClass)
      } else if (streak > 20) {
        modal('AI SHUTDOWN. AUTOMATED MESSAGE: "' + streak + '"', 6000, createDemoPath)
      } else if (streak > 19) {
        modal(streak + ', ' + streak + ', ' + streak + ', ' + streak, 1, createDemoPath)
      } else if (streak > 18) {
        modal('Text on a screen is just text on a screen...', 6000, createDemoPath)
      } else if (streak > 16) {
        modal(streak + ' is just a number on your screen...', 6000, createDemoPath)
        game.classList.add(rotateClass)
      } else if (streak > 15) {
        modal(streak + ' <i>memory</i> streak!!!!!', 6000, createDemoPath)
      } else if (streak > 14) {
        modal(streak + ' <i>memory</i> streak!!!', 6000, createDemoPath)
      } else if (streak > 13) {
        modal('Do you remember <i>anything but</i> these dots?', 6000, createDemoPath)
      } else if (streak > 12) {
        modal('Even <i>I</i> can’t complete this many levels...', 6000, createDemoPath)
        game.classList.add(scaleClass)
      } else if (streak > 9) {
        modal(streak + ' <i>memory</i> streak!', 6000, createDemoPath)
      } else if (streak > 8) {
        modal('Beat this...', 6000, createDemoPath)
        game.classList.add(rotateClass)
      } else if (streak > 7) {
        modal('What were you doing <i>before</i> this game?', 6000, createDemoPath)
      } else if (streak > 6) {
        modal('See you next round...', 6000, createDemoPath)
      } else if (streak > 4) {
        modal(streak + ' <i>memory</i> streak!', 6000, createDemoPath)
      } else {
        modal('<i>Correct</i>!', 6000, createDemoPath)
        game.classList.add(rotateClass)
      }
    } else {
      if (streak > 30) {
        modal('<i>Incorrect...</i><br>But ' + streak + ' is so close to the finish line!!! AGAIN!!', 18000, createDemoPath)
      } else if (streak > 10) {
        modal('<i>Incorrect...</i><br>But a streak of ' + streak + ' is still pretty good!', 18000, createDemoPath)
      } else {
        modal('<i>Incorrect...</i>', 6000, createDemoPath)
      }

      setScore(0)
    }
  }

  function getTracePath (desiredPath) {
    goalPath = desiredPath
    disabled = true
    game.classList.remove(activeClass)

    pathCoords = 'M 300,300'
    lastCoords = {'x': 300, 'y': 300}

    finger.setAttribute('fill', colors.startCircle)

    interact('#finger')
      .styleCursor(false)
      .draggable({
        inertia: false,
        onmove: dragMoveListener,
        onend: dragEndListener
      })
  }

  function init () {
    if (streak > 0) {
      modal('Welcome back!<br>Your current <i>memory streak</i> is ' + streak + '.<br>Keep going!', 6000, createDemoPath)
      scoreEl.classList.add(activeClass)
      scoreEl.innerHTML = streak
    } else {
      modal('Watch and <i>remember</i> the path...', 6000, createDemoPath)
    }
    html.classList.add('is-loaded')
  }

  window.addEventListener('resize', function () {
    gameSize = game.getBoundingClientRect()
    gameScale = (gameSize.width > originalSize) ? (originalSize / gameSize.height) : (originalSize / gameSize.width)
  }, false)

  window.setTimeout(function () {
    window.requestAnimationFrame(init)
  }, 9000)
}(this))
