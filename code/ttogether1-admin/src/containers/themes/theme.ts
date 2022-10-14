import { createTheme, responsiveFontSizes } from '@material-ui/core/styles';

let theme = createTheme({
    overrides: {
        MuiTableSortLabel: {
            root: {
                height: '100% !important'
            }
        },
        MuiPopover: {
            root: {
                '& .MuiFormControl-root': {
                    minWidth: '170px'
                }
            }
        },
        MuiTableCell: {
            root: {
                '&:not(:first-child)': {
                    minWidth: 120
                },
                '& > .MuiButtonBase-root': {
                    padding: 0,
                    minWidth: 'auto'
                }
            }
        },
        MuiInputLabel: {
            outlined: {
                backgroundColor: '#fff',
                paddingLeft: 3,
                paddingRight: 3
            }
        }
    },
    palette: {
        primary: {
            main: '#451A78'
        },
        secondary: {
            main: '#EDE3F6'
        },
        error: {
            main: '#ff785a'
        },
        success: {
            main: '#7ecf09'
        },
        warning: {
            main: '#fbb330'
        },
        info: {
            main: '#16b4be'
        },
        background: {
            default: '#fafafa'
        }
    }
});

theme = responsiveFontSizes(theme);

export default theme;
