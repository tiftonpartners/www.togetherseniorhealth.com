import 'package:flutter/material.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/style.dart';

import '../../../../constants/colors.dart';

Duration animationTime = Duration(milliseconds: 300);
double fontSize = 14;

class DialogButton extends StatelessWidget {
  const DialogButton(
      {Key key,
      @required this.text,
      @required this.color,
      @required this.textColor,
      @required this.onTap,
      @required this.borderColor})
      : super(key: key);

  final String text;
  final Color color, textColor, borderColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 150,
      child: RaisedButton(
        hoverElevation: 0.2,
        onPressed: () {
          Navigator.pop(context);
          onTap();
        },
        child: Text(text),
        textColor: textColor,
        color: color,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(4)),
            side: BorderSide(color: borderColor, width: 0.5)),
      ),
    );
  }
}

class SwitchColorButton extends StatefulWidget {
  final bool collapse;
  final Color color1;
  final Color color2;
  final String text;
  final IconData icon;
  final VoidCallback onTap;

  const SwitchColorButton(
      {Key key,
      this.collapse = false,
      @required this.color1,
      @required this.color2,
      @required this.text,
      @required this.icon,
      this.onTap})
      : super(key: key);

  @override
  _SwitchColorButtonState createState() => _SwitchColorButtonState();
}

class _SwitchColorButtonState extends State<SwitchColorButton> {
  bool isPressed = true;
  Color buttonColor;
  Color textColor = Palette.kGrey;
  String futureText;

  @override
  void initState() {
    super.initState();
    buttonColor = widget.color1;
    futureText = widget.text;
  }

  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: 3),
      child: AnimatedContainer(
        duration: animationTime,
        width: widget.collapse ? 80 : 160,
        height: widget.collapse ? 80 : 100,
        child: RawMaterialButton(
          onPressed: () {
            widget.onTap();
            isPressed = !isPressed;
            setState(() {
              buttonColor = isPressed ? widget.color1 : widget.color2;
              textColor = isPressed ? Palette.kGrey : Palette.kBlack;
            });
          },
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Icon(
                  widget.icon,
                  color: Colors.blueAccent,
                  size: 35.0,
                ),
                AnimatedOpacity(
                  onEnd: () {},
                  opacity: widget.collapse ? 0.0 : 1.0,
                  duration: animationTime,
                  child: widget.collapse
                      ? Container()
                      : Text(futureText,
                          style: titleStyle.copyWith(
                            color: textColor,
                            fontSize: 14,
                          )),
                ),
              ],
            ),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 2.0,
          fillColor: buttonColor,
          padding: const EdgeInsets.all(0.0),
        ),
      ),
    );
  }
}
