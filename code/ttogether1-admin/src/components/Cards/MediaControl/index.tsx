import React from 'react';
import { WithStyles, withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import { CardContent, CardMedia } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import styles from './style';

export interface IMediaControlCardProps extends WithStyles<typeof styles> {}
const MediaControlCard: React.FC<IMediaControlCardProps> = (props) => {
	const classes = props.classes;

	return (
		<div>
			<Card className={classes.card}>
				<div className={classes.details}>
					<CardContent className={classes.content}>
						<Typography variant="h2">Live From Space</Typography>
						<Typography variant="h3" color="secondary">
							Mac Miller
						</Typography>
					</CardContent>
					<div className={classes.controls}>
						<IconButton aria-label="Previous">
							<SkipPreviousIcon />
						</IconButton>
						<IconButton aria-label="Play/pause">
							<PlayArrowIcon className={classes.playIcon} />
						</IconButton>
						<IconButton aria-label="Next">
							<SkipNextIcon />
						</IconButton>
					</div>
				</div>
				<CardMedia
					className={classes.cover}
					image="https://via.placeholder.com/500x330"
					title="Live from space album cover"
				/>
			</Card>
		</div>
	);
};

export default withStyles(styles)(MediaControlCard);
