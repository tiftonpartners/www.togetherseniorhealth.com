import 'package:flutter/material.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/style.dart';

class SwitchButton extends StatefulWidget {
  const SwitchButton({
    Key key,
    this.initial = true,
    this.expandable = false,
    this.onChange,
    @required this.rightIcon,
    @required this.wrongIcon,
    @required this.color,
    @required this.selectColor,
    @required this.rightText,
    @required this.wrongText,
  }) : super(key: key);
  final bool initial, expandable;
  final Function(bool state) onChange;
  final IconData rightIcon, wrongIcon;
  final Color color, selectColor;
  final String rightText, wrongText;

  @override
  _SwitchButtonState createState() => _SwitchButtonState();
}

class _SwitchButtonState extends State<SwitchButton> {
  bool _currentState = true;
  int checkTime;
  Duration animationTime = Duration(milliseconds: 300);
  double fontSize = 14;
  @override
  void initState() {
    _currentState = widget.initial;
    // widget.onChange(_currentState);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      width: widget.expandable ? 80 : 160,
      height: widget.expandable ? 80 : 100,
      duration: animationTime,
      child: Padding(
        padding: EdgeInsets.only(top: 5.0),
        child: Container(
          child: RawMaterialButton(
            onPressed: () {
              setState(() {
                _currentState = !_currentState;
                widget.onChange(_currentState);
              });
            },
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _currentState ? widget.rightIcon : widget.wrongIcon,
                    color: widget.color,
                    size: 35.0,
                  ),
                  Center(
                      child: AnimatedOpacity(
                    // If the widget is visible, animate to 0.0 (invisible).
                    // If the widget is hidden, animate to 1.0 (fully visible).
                    opacity: widget.expandable ? 0.0 : 1.0,
                    duration: animationTime,
                    // The green box must be a child of the AnimatedOpacity widget.
                    child: widget.expandable
                        ? Container()
                        : Text(
                            _currentState ? widget.rightText : widget.wrongText,
                            style: titleStyle.copyWith(
                              color: Palette.kGrey,
                              fontSize: 14,
                            )),
                  ))
                ],
              ),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 2.0,
            fillColor: Palette.kButtonCall,
            padding: const EdgeInsets.all(15.0),
          ),
        ),
      ),
    );
  }
}
