import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'

function autoBind(methods, context) {
  methods.forEach(method => {
    // eslint-disable-next-line no-param-reassign
    context[method] = context[method].bind(context)
  })
}

export default class Swipe extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentIndex: props.initialIndex,
      width: 0,
      scrollLeft: 0,
      drag: 0
    }

    autoBind([
      'setWidth',
      'handleTouchStart',
      'handleTouchEnd',
      'handleTouchMove',
      'gotoNext',
      'gotoPrev',
      'onChange',
      'initLazyLoad',
      'hasSingleImage'
    ], this)
  }

  componentDidMount() {
    this.setWidth()
    this.initLazyLoad()

    if (this.props.responsive) {
      window.addEventListener('resize', this.setWidth, false)
    }
  }

  setWidth() {
    if (this.swipeRef) {
      this.setState({
        width: this.swipeRef.clientWidth
      })
    }
  }

  handleTouchStart(e) {
    if (this.hasSingleImage()) return;
    this.clientX = e.touches[0].clientX
    document.addEventListener('touchmove', this.handleTouchMove, false)
  }

  handleTouchEnd() {
    if (this.hasSingleImage()) return;
    const {drag, currentIndex, width} = this.state
    const {threshold} = this.props

    const initialIndex = currentIndex

    if (Math.abs(drag) > threshold * width) {
      this.setState(() => {
        if (drag < 0 && currentIndex > 0) {
          return {
            // goto previous slide
            currentIndex: currentIndex - 1
          }
        } else if (drag > 0 && ((currentIndex + 1) < this.props.children.length)) {
          return {
            // goto next slide
            currentIndex: currentIndex + 1
          }
        }
      }, () => {
        this.onChange(initialIndex)
      })
    }

    this.setState({
      drag: 0
    })

    document.removeEventListener('touchmove', this.handleTouchMove, false)
  }

  initLazyLoad() {
    const {currentIndex} = this.state
    const {overScan, children} = this.props
    this[`imageRef${currentIndex}`].load()
    if (overScan === 1) {
      if (currentIndex > 0) this[`imageRef${currentIndex - 1}`].load()
      if (currentIndex + 1 < children.length) this[`imageRef${currentIndex + 1}`].load()
    }
  }

  handleTouchMove(e) {
    const dx = this.clientX - e.touches[0].clientX

    this.setState({
      drag: dx
    })
  }

  gotoPrev() {
    const {currentIndex} = this.state
    const initialIndex = currentIndex
    if (currentIndex > 0) {
      this.setState({
        currentIndex: currentIndex - 1
      }, () => (this.onChange(initialIndex)))
    }
  }

  gotoNext() {
    const {currentIndex} = this.state
    const initialIndex = currentIndex
    if (currentIndex + 1 < this.props.children.length) {
      this.setState({
        currentIndex: currentIndex + 1
      }, () => (this.onChange(initialIndex)))
    }
  }

  gotoSlide(i) {
    this.setState({
      currentIndex: i
    })
  }

  onChange(initialIndex) {
    this.props.onSwipe({
      currentIndex: this.state.currentIndex,
      initialIndex
    })
    this.initLazyLoad()
  }

  hasSingleImage() {
    return !(this.props.children.length > 1)
  }

  render() {
    const {className, children, prev, next} = this.props

    const {width, drag, currentIndex} = this.state

    const mainClass = classNames('react-swipe', className)

    const nextClass = classNames('rs-next', {
      disabled: currentIndex + 1 >= children.length
    })

    const prevClass = classNames('rs-prev', {
      disabled: currentIndex === 0
    })

    const style = {
      width: `${children.length * width}px`,
      transform: `translateX(${-(currentIndex * width) - drag}px)`
    }
    const self = this;
    const children$ = React.Children.map(children, (child, index) => (
      React.cloneElement(child, {
        width,
        ref: (ref) => ( self[`imageRef${index}`] = ref),
        index
      }))
    );

    return (
      <div className={mainClass}>
        <div className='rs-swipe-gallery' ref={(swipe) => (this.swipeRef = swipe)}>
          <div
            className='rs-imgs-wrapper'
            style={style}
            onTouchStart={this.handleTouchStart}
            onTouchEnd={this.handleTouchEnd}
          >
            {children$}
          </div>
        </div>
        {!this.hasSingleImage() && <div className={prevClass} onClick={this.gotoPrev}>{prev}</div>}
        {!this.hasSingleImage() && <div className={nextClass} onClick={this.gotoNext}>{next}</div>}
      </div>
    )
  }
}

Swipe.propTypes = {
  // custom class name for the component
  className: PropTypes.string,

  // number of images to be loaded in advance
  overScan: PropTypes.oneOf([0, 1]),

  // function called on slide change
  // argument { initialIndex, currentIndex }
  onSwipe: PropTypes.func,

  // index of initially visible image
  initialIndex: PropTypes.number,

  // drag ratio of full width for successful swipe
  threshold: PropTypes.number,

  // whether responsive to window resize
  responsive: PropTypes.bool,

  // prev React element
  prev: PropTypes.element,

  // next React element
  next: PropTypes.element
}

Swipe.defaultProps = {
  overScan: 1,
  initialIndex: 0,
  onSwipe () {
  },
  prev: <button>PREV</button>,
  next: <button>NEXT</button>,
  threshold: 0.5,
  responsive: true
}