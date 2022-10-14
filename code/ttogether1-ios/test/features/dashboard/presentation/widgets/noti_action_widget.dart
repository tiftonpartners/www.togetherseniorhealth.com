import 'package:flutter/material.dart';

class NotiAction extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color backgroundColor;
  const NotiAction({
    Key key,
    this.icon,
    this.color = Colors.white,
    this.backgroundColor = Colors.green,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.all(Radius.circular(8)),
        color: backgroundColor,
      ),
      margin: EdgeInsets.all(4),
      padding: EdgeInsets.all(8),
      child: icon == null
          ? Image.asset(
              'assets/spotlight.png',
              height: 24,
            )
          : Icon(
              icon,
              color: color,
            ),
    );
  }
}
